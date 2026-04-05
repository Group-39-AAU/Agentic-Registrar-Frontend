"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  callbackApplicationPayment,
  fetchPrograms,
  getStoredAccessToken,
  initiateApplicationPayment,
  submitUndergraduateApplication,
  validateUndergraduateApplication,
  verifyCredentialsUndergraduateApplication,
  type PaymentInitiateResponse,
  type ProgramItem,
} from "@/lib/api";
import { FormInput, FormSelect } from "./AdmissionFormFields";

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function AdmissionApplicationForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sponsorshipType: "" as "" | "GOVERNMENT" | "SELF_SPONSORED",
    stream: "" as "" | "NATURAL" | "SOCIAL",
    programChoice1: "",
    programChoice2: "",
    programChoice3: "",
    admissionNumber: "",
    admissionTerm: "Fall 2026",
  });
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [programsError, setProgramsError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [createdApplicationId, setCreatedApplicationId] = useState<string | null>(
    null
  );
  const [paymentInit, setPaymentInit] = useState<PaymentInitiateResponse | null>(
    null
  );
  const [paymentStartLoading, setPaymentStartLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [modalPaymentRef, setModalPaymentRef] = useState("");
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stream = formData.stream;
    if (stream !== "NATURAL" && stream !== "SOCIAL") {
      setPrograms([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setProgramsLoading(true);
      setProgramsError(null);
      try {
        const items = await fetchPrograms(stream);
        const active = items.filter((p) => p.is_active !== false);
        if (!cancelled) {
          setPrograms(active);
          setFormData((prev) => ({
            ...prev,
            programChoice1: "",
            programChoice2: "",
            programChoice3: "",
          }));
        }
      } catch (e) {
        if (!cancelled) {
          setPrograms([]);
          setProgramsError(
            e instanceof ApiError ? e.message : "Could not load programs."
          );
        }
      } finally {
        if (!cancelled) setProgramsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.stream]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentInit) return;
    setModalPaymentRef(paymentInit.payment_reference);
  }, [paymentModalOpen, paymentInit]);

  useEffect(() => {
    if (!paymentModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaymentModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paymentModalOpen]);

  const programOptions = useMemo(
    () =>
      programs.map((p) => ({
        value: p.id,
        label: `${p.code} — ${p.name} (${p.department})`,
      })),
    [programs]
  );

  /** Each choice list omits programs selected in the other two slots (freed when those change). */
  const programOptionsChoice1 = useMemo(
    () =>
      programOptions.filter(
        (o) =>
          o.value !== formData.programChoice2 && o.value !== formData.programChoice3
      ),
    [programOptions, formData.programChoice2, formData.programChoice3]
  );
  const programOptionsChoice2 = useMemo(
    () =>
      programOptions.filter(
        (o) =>
          o.value !== formData.programChoice1 && o.value !== formData.programChoice3
      ),
    [programOptions, formData.programChoice1, formData.programChoice3]
  );
  const programOptionsChoice3 = useMemo(
    () =>
      programOptions.filter(
        (o) =>
          o.value !== formData.programChoice1 && o.value !== formData.programChoice2
      ),
    [programOptions, formData.programChoice1, formData.programChoice2]
  );

  const handleNext = () => {
    setSubmitError(null);
    if (step === 1) {
      if (!formData.sponsorshipType || !formData.stream) {
        setSubmitError("Please select sponsorship type and stream.");
        return;
      }
      if (programsLoading) {
        setSubmitError("Programs are still loading for this stream. Please wait.");
        return;
      }
      if (programsError) {
        setSubmitError(programsError);
        return;
      }
      if (programs.length === 0) {
        setSubmitError(
          "No programs are available for this stream. Pick another stream or try again later."
        );
        return;
      }
    }
    if (step === 2) {
      if (
        !formData.programChoice1 ||
        !formData.programChoice2 ||
        !formData.programChoice3
      ) {
        setSubmitError("Please choose all three program preferences.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setSubmitError(null);
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.admissionNumber.trim()) {
      setSubmitError("Admission number is required.");
      return;
    }
    if (!formData.admissionTerm.trim()) {
      setSubmitError("Admission term is required.");
      return;
    }

    const token = getStoredAccessToken();
    setSubmitLoading(true);
    try {
      const created = await submitUndergraduateApplication(
        {
          sponsorship_type: formData.sponsorshipType,
          stream: formData.stream,
          admission_number: formData.admissionNumber.trim(),
          admission_term: formData.admissionTerm.trim(),
          program_choice_1_id: formData.programChoice1,
          program_choice_2_id: formData.programChoice2,
          program_choice_3_id: formData.programChoice3,
          extra_data: {},
        },
        token
      );
      if (!created.id) {
        throw new ApiError(500, {
          detail: "Application was created but no id was returned.",
        });
      }
      setCreatedApplicationId(created.id);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Submission failed. Sign in or register again if needed."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStartPayment = async () => {
    if (!createdApplicationId) return;
    const token = getStoredAccessToken();
    setPaymentError(null);
    setPaymentStartLoading(true);
    try {
      const data = await initiateApplicationPayment(createdApplicationId, token);
      setPaymentInit(data);
    } catch (err) {
      setPaymentError(
        err instanceof ApiError ? err.message : "Could not start payment."
      );
    } finally {
      setPaymentStartLoading(false);
    }
  };

  const copyReference = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setPaymentError("Could not copy. Please copy the reference manually.");
    }
  };

  const handlePayInModal = async () => {
    if (!createdApplicationId || !paymentInit) return;
    const ref = modalPaymentRef.trim();
    if (!ref) {
      setPaymentError("Enter the payment reference.");
      return;
    }
    const token = getStoredAccessToken();
    setPaymentError(null);
    setFinalizeLoading(true);
    try {
      await callbackApplicationPayment(
        createdApplicationId,
        { payment_reference: ref, status: "COMPLETED" },
        token
      );
      await validateUndergraduateApplication(createdApplicationId, token);
      await verifyCredentialsUndergraduateApplication(createdApplicationId, token);
      setPaymentModalOpen(false);
      router.push("/admissions/apply/success");
    } catch (err) {
      setPaymentError(
        err instanceof ApiError ? err.message : "Payment confirmation failed."
      );
    } finally {
      setFinalizeLoading(false);
    }
  };

  /* ——— Post–application success (before payment) ——— */
  if (createdApplicationId && !paymentInit) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 p-3 text-green-600">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-[20px] font-bold text-[#2a2a2a]">
          Admission successful
        </h2>
        <p className="mt-2 max-w-[400px] text-[14px] text-[#5a5a5a]">
          Your application was submitted. Continue to payment to complete the
          process.
        </p>
        {paymentError ? (
          <p
            role="alert"
            className="mt-4 max-w-[400px] rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-800"
          >
            {paymentError}
          </p>
        ) : null}
        <button
          type="button"
          disabled={paymentStartLoading}
          onClick={handleStartPayment}
          className="mt-8 h-[44px] min-w-[220px] rounded-md bg-[#3f79b5] px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#356e9f] disabled:opacity-60"
        >
          {paymentStartLoading ? "Starting…" : "Start payment"}
        </button>
      </div>
    );
  }

  /* ——— Payment initiated: reference + instructions + modal ——— */
  if (createdApplicationId && paymentInit) {
    return (
      <>
        <div className="flex flex-col gap-6 py-6">
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-left">
            <p className="text-[13px] font-semibold text-green-900">
              Payment link ready
            </p>
            {paymentInit.message ? (
              <p className="mt-1 text-[13px] text-green-800">{paymentInit.message}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
              Payment reference
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="break-all rounded-md bg-[#f1f5f9] px-3 py-2 font-mono text-[12px] text-[#1a1a1a]">
                {paymentInit.payment_reference}
              </code>
              <button
                type="button"
                onClick={() => copyReference(paymentInit.payment_reference)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-[12px] font-semibold text-[#2f76b7] transition-colors hover:bg-[#f8fafc]"
              >
                <CopyIcon className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-[#5a5a5a]">
              <strong className="text-[#3a3a3a]">Important:</strong> Copy this
              reference and keep it handy. In the payment window, paste it where
              required and follow the provider steps. When you are done, use the
              button below to confirm payment in this portal.
            </p>
          </div>

          {paymentInit.payment_url ? (
            <a
              href={paymentInit.payment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[14px] font-semibold text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
            >
              Open payment provider in a new tab
            </a>
          ) : null}

          {paymentError ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
            >
              {paymentError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="h-[48px] w-full max-w-[320px] self-center rounded-md bg-[#3f79b5] text-[15px] font-semibold text-white shadow-md transition-colors hover:bg-[#356e9f]"
          >
            Open payment window
          </button>
        </div>

        {paymentModalOpen ? (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPaymentModalOpen(false);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-dialog-title"
              className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-5">
                <h2
                  id="payment-dialog-title"
                  className="text-[18px] font-bold text-[#2a66a7]"
                >
                  Finish payment
                </h2>
                <p className="mt-1 text-[13px] text-[#5a5a5a]">
                  Enter the payment reference you used with the provider, then
                  confirm.
                </p>
              </div>
              <div className="space-y-4 px-6 py-6">
                <div>
                  <label
                    htmlFor="modal-payment-ref"
                    className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]"
                  >
                    Payment reference
                  </label>
                  <input
                    id="modal-payment-ref"
                    type="text"
                    value={modalPaymentRef}
                    onChange={(e) => setModalPaymentRef(e.target.value)}
                    className="w-full rounded-lg border border-[#9bb0cc] bg-[#eef4ff] px-3 py-2.5 text-[14px] text-[#1a1a1a] outline-none focus:border-[#2f76b7] focus:ring-2 focus:ring-[#2f76b7]/25"
                    placeholder="Paste or enter reference"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="h-[42px] rounded-lg border border-gray-300 px-5 text-[14px] font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={finalizeLoading}
                    onClick={handlePayInModal}
                    className="h-[42px] min-w-[120px] rounded-lg bg-[#3f79b5] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#356e9f] disabled:opacity-60"
                  >
                    {finalizeLoading ? "Processing…" : "Pay"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`grid h-8 w-8 place-items-center rounded-full border-2 text-[12px] font-bold ${
                step >= s
                  ? "border-[#3f79b5] bg-[#3f79b5] text-white"
                  : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {s}
            </div>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                step >= s ? "text-[#3f79b5]" : "text-gray-400"
              }`}
            >
              {s === 1 ? "Sponsorship" : s === 2 ? "Programs" : "Details"}
            </span>
            {s < 3 ? <div className="h-[1px] w-8 bg-gray-200" /> : null}
          </div>
        ))}
      </div>

      {submitError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
        >
          {submitError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5">
              <FormSelect
                label="Sponsorship type"
                name="sponsorshipType"
                required
                value={formData.sponsorshipType}
                options={[
                  { value: "GOVERNMENT", label: "Government sponsored" },
                  { value: "SELF_SPONSORED", label: "Self-sponsored" },
                ]}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    sponsorshipType: e.target.value as typeof p.sponsorshipType,
                  }))
                }
              />
              <FormSelect
                label="Stream"
                name="stream"
                required
                value={formData.stream}
                options={[
                  { value: "NATURAL", label: "Natural" },
                  { value: "SOCIAL", label: "Social" },
                ]}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    stream: e.target.value as typeof p.stream,
                  }))
                }
              />
            </div>
            <p className="text-[12px] text-[#5a5a5a]">
              Program list on the next step is loaded for the stream you select
              (NATURAL or SOCIAL).
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="h-[40px] rounded-md bg-[#3f79b5] px-8 font-semibold text-white transition-colors hover:bg-[#356e9f]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            {programsLoading ? (
              <p className="text-[13px] text-[#5a5a5a]">Loading programs…</p>
            ) : null}
            {programsError ? (
              <p className="text-[13px] text-red-600">{programsError}</p>
            ) : null}
            {!programsLoading && programOptions.length === 0 && !programsError ? (
              <p className="text-[13px] text-[#5a5a5a]">
                No programs returned for this stream. Try another stream or
                check the API.
              </p>
            ) : null}

            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-[#3a3a3a]">
                Program preferences (1st–3rd choice)
              </h3>
              <p className="text-[12px] text-[#5a5a5a]">
                Choose three different programs. Changing one updates the other lists so
                the same program cannot be picked twice.
              </p>
              <FormSelect
                label="First choice"
                name="programChoice1"
                value={formData.programChoice1}
                options={programOptionsChoice1}
                required
                disabled={programOptions.length === 0}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, programChoice1: e.target.value }))
                }
              />
              <FormSelect
                label="Second choice"
                name="programChoice2"
                value={formData.programChoice2}
                options={programOptionsChoice2}
                required
                disabled={programOptions.length === 0}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, programChoice2: e.target.value }))
                }
              />
              <FormSelect
                label="Third choice"
                name="programChoice3"
                value={formData.programChoice3}
                options={programOptionsChoice3}
                required
                disabled={programOptions.length === 0}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, programChoice3: e.target.value }))
                }
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="h-[40px] rounded-md border border-gray-300 px-8 font-semibold text-gray-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="h-[40px] rounded-md bg-[#3f79b5] px-8 font-semibold text-white transition-colors hover:bg-[#356e9f]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5">
              <FormInput
                label="Admission number"
                name="admissionNumber"
                placeholder="e.g. 2955397"
                value={formData.admissionNumber}
                required
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    admissionNumber: e.target.value,
                  }))
                }
              />
              <FormInput
                label="Admission term"
                name="admissionTerm"
                placeholder="Fall 2026"
                value={formData.admissionTerm}
                required
                onChange={(e) =>
                  setFormData((p) => ({ ...p, admissionTerm: e.target.value }))
                }
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="h-[40px] rounded-md border border-gray-300 px-8 font-semibold text-gray-600"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="h-[40px] rounded-md bg-[#3f79b5] px-8 font-semibold text-white transition-colors hover:bg-[#356e9f] disabled:opacity-60"
              >
                {submitLoading ? "Submitting…" : "Submit application"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
