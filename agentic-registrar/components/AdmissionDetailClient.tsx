"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  callbackApplicationPayment,
  clearStoredAccessToken,
  fetchApplicationCorrectionContext,
  fetchEnrollmentByApplicationId,
  fetchTestingCenterCallback,
  fetchUndergraduateApplicationById,
  getStoredAccessToken,
  initiateApplicationPayment,
  submitApplicationCorrections,
  type CorrectionContext,
  type EnrollmentRecord,
  type PaymentInitiateResponse,
  type TestingCenterCallbackResponse,
  type UndergraduateApplicationRecord,
} from "@/lib/api";

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

function termText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybe = value as { term_name?: unknown; id?: unknown };
    if (typeof maybe.term_name === "string") return maybe.term_name;
    if (typeof maybe.id === "string") return maybe.id;
  }
  return "—";
}

function StatusBadge({ value, kind }: { value: string; kind: "status" | "payment" }) {
  const v = value?.toUpperCase() ?? "";
  const kindLabel = kind === "payment" ? "payment" : "status";
  let cls =
    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ";
  if (kind === "payment") {
    if (v.includes("PENDING")) cls += "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    else if (v.includes("PAID") || v.includes("COMPLETE"))
      cls += "bg-green-100 text-green-900 ring-1 ring-green-200";
    else cls += "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
  } else {
    if (v.includes("DRAFT")) cls += "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
    else if (v.includes("SUBMIT") || v.includes("REVIEW"))
      cls += "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
    else if (v.includes("APPROVE") || v.includes("ACCEPT"))
      cls += "bg-green-100 text-green-900 ring-1 ring-green-200";
    else if (v.includes("REJECT") || v.includes("DENY"))
      cls += "bg-red-100 text-red-900 ring-1 ring-red-200";
    else cls += "bg-[#eef4ff] text-[#2a66a7] ring-1 ring-[#c5d9f5]";
  }
  return (
    <span className={cls}>
      <span className="mr-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-semibold lowercase tracking-normal">
        {kindLabel}
      </span>
      <span>{value || "—"}</span>
    </span>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-3.5">
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
        {label}
      </dt>
      <dd className="text-[14px] text-[#1a1a1a]">{children}</dd>
    </div>
  );
}

function IdLine({ id }: { id: string }) {
  return (
    <span className="break-all font-mono text-[12px] text-[#3a3a3a]" title={id}>
      {id}
    </span>
  );
}

function ProgramChoiceDisplay({
  program,
  fallbackId,
}: {
  program?: {
    id: string;
    code: string;
    name: string;
  } | null;
  fallbackId: string;
}) {
  if (program) {
    return (
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[#1a1a1a]">{program.name}</p>
        <p className="text-[13px] text-[#3a3a3a]">
          <span className="font-mono font-semibold text-[#2f76b7]">{program.code}</span>
          <span className="text-[#5a5a5a]"> · {program.id}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-[13px] text-amber-800">Program could not be loaded.</p>
      <IdLine id={fallbackId} />
    </div>
  );
}

export default function AdmissionDetailClient({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<UndergraduateApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [paymentInit, setPaymentInit] = useState<PaymentInitiateResponse | null>(null);
  const [paymentStartLoading, setPaymentStartLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [modalPaymentRef, setModalPaymentRef] = useState("");
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [uatLoading, setUatLoading] = useState(false);
  const [uatError, setUatError] = useState<string | null>(null);
  const [uatResult, setUatResult] = useState<TestingCenterCallbackResponse | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [correctionAdmissionNumber, setCorrectionAdmissionNumber] = useState("");
  const [correctionFirstName, setCorrectionFirstName] = useState("");
  const [correctionLastName, setCorrectionLastName] = useState("");
  const [correctionStream, setCorrectionStream] = useState<"NATURAL" | "SOCIAL" | "">("");
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [correctionSuccessModalOpen, setCorrectionSuccessModalOpen] = useState(false);
  const [correctionContext, setCorrectionContext] = useState<CorrectionContext | null>(null);
  const [correctionContextLoading, setCorrectionContextLoading] = useState(false);

  const reloadApplication = async () => {
    try {
      const row = await fetchUndergraduateApplicationById(applicationId);
      setData(row);
    } catch {
      // ignore — keep existing data
    }
  };

  useEffect(() => {
    if (!getStoredAccessToken()) {
      setLoading(false);
      setError("not_authenticated");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchUndergraduateApplicationById(applicationId);
        if (!cancelled) {
          setData(row);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            setError("session_expired");
          } else if (e instanceof ApiError && e.status === 404) {
            setError("not_found");
          } else {
            setError(
              e instanceof ApiError ? e.message : "Could not load this application."
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    if (!paymentModalOpen || !paymentInit) return;
    setModalPaymentRef(paymentInit.payment_reference);
  }, [paymentModalOpen, paymentInit]);

  // Fetch the enrollment record once the application reaches ENROLLED so we
  // can show the student's university ID. The backend returns 404 until the
  // enrollment row is created, which the helper normalizes to null.
  useEffect(() => {
    if (!data) return;
    if ((data.current_status ?? "").toUpperCase() !== "ENROLLED") {
      setEnrollment(null);
      return;
    }
    let cancelled = false;
    setEnrollmentLoading(true);
    (async () => {
      try {
        const row = await fetchEnrollmentByApplicationId(applicationId);
        if (!cancelled) setEnrollment(row);
      } catch {
        if (!cancelled) setEnrollment(null);
      } finally {
        if (!cancelled) setEnrollmentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, data]);

  // Pre-fill the correction form with the applicant's current values
  // whenever the app loads in CHANGES_REQUESTED — but only seed each
  // field once (don't overwrite what the student is actively editing).
  useEffect(() => {
    if (!data) return;
    if ((data.current_status ?? "").toUpperCase() !== "CHANGES_REQUESTED") return;
    setCorrectionAdmissionNumber((prev) => prev || data.admission_number || "");
    setCorrectionFirstName((prev) => prev || data.applicant_first_name || "");
    setCorrectionLastName((prev) => prev || data.applicant_last_name || "");
    setCorrectionStream((prev) => {
      if (prev) return prev;
      const s = (data.stream ?? "").toUpperCase();
      return s === "NATURAL" || s === "SOCIAL" ? s : "";
    });
  }, [data]);

  // Fetch the correction-reasoning bundle (officer note + agent
  // summary + humanized reasoning steps) so the student can see WHY
  // changes were requested. Only runs when status is CHANGES_REQUESTED.
  useEffect(() => {
    if (!data) {
      setCorrectionContext(null);
      return;
    }
    if ((data.current_status ?? "").toUpperCase() !== "CHANGES_REQUESTED") {
      setCorrectionContext(null);
      return;
    }
    let cancelled = false;
    setCorrectionContextLoading(true);
    (async () => {
      try {
        const ctx = await fetchApplicationCorrectionContext(applicationId);
        if (!cancelled) setCorrectionContext(ctx);
      } catch {
        if (!cancelled) setCorrectionContext(null);
      } finally {
        if (!cancelled) setCorrectionContextLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, data]);

  useEffect(() => {
    if (!paymentModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaymentModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paymentModalOpen]);

  const handleStartPayment = async () => {
    setPaymentError(null);
    setPaymentStartLoading(true);
    try {
      const init = await initiateApplicationPayment(applicationId);
      setPaymentInit(init);
      setPaymentModalOpen(true);
    } catch (err) {
      setPaymentError(
        err instanceof ApiError ? err.message : "Could not start payment."
      );
    } finally {
      setPaymentStartLoading(false);
    }
  };

  const handlePayInModal = async () => {
    if (!paymentInit) return;
    const ref = modalPaymentRef.trim();
    if (!ref) {
      setPaymentError("Enter the payment reference.");
      return;
    }
    setPaymentError(null);
    setFinalizeLoading(true);
    try {
      await callbackApplicationPayment(applicationId, {
        payment_reference: ref,
        status: "COMPLETED",
      });
      setPaymentModalOpen(false);
      setPaymentInit(null);
      await reloadApplication();
    } catch (err) {
      setPaymentError(
        err instanceof ApiError ? err.message : "Payment confirmation failed."
      );
    } finally {
      setFinalizeLoading(false);
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

  const handleSubmitCorrections = async () => {
    const admissionNumber = correctionAdmissionNumber.trim();
    const firstName = correctionFirstName.trim();
    const lastName = correctionLastName.trim();
    const stream = correctionStream;

    if (!admissionNumber || !firstName || !lastName || !stream) {
      setCorrectionError("Admission number, first name, last name, and stream are all required.");
      return;
    }

    setCorrectionLoading(true);
    setCorrectionError(null);
    try {
      await submitApplicationCorrections(applicationId, {
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName,
        stream,
      });
      setCorrectionSuccessModalOpen(true);
      await reloadApplication();
    } catch (err) {
      setCorrectionError(
        err instanceof ApiError ? err.message : "Could not submit corrections."
      );
    } finally {
      setCorrectionLoading(false);
    }
  };

  const handleCheckUat = async () => {
    if (!data?.uat_id) return;
    setUatError(null);
    setUatLoading(true);
    try {
      const result = await fetchTestingCenterCallback(data.uat_id);
      setUatResult(result);
    } catch (err) {
      setUatError(
        err instanceof ApiError ? err.message : "Could not fetch UAT result."
      );
    } finally {
      setUatLoading(false);
    }
  };

  useEffect(() => {
    if (!data?.uat_id) {
      setUatResult(null);
      setUatError(null);
      setUatLoading(false);
      return;
    }
    void handleCheckUat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.uat_id]);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white px-8 py-16 text-center text-[14px] text-[#5a5a5a] shadow-sm">
        Loading application…
      </div>
    );
  }

  if (error === "not_authenticated" || error === "session_expired") {
    return (
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-8 py-10 text-center">
        <p className="text-[14px] text-[#5a5a5a]">
          {error === "session_expired"
            ? "Your session expired. Please log in again."
            : "Please log in to view this application."}
        </p>
        <button
          type="button"
          onClick={() => {
            clearStoredAccessToken();
            router.push("/admissions/login");
          }}
          className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#3f79b5] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#356e9f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f79b5] focus-visible:ring-offset-2"
        >
          Go to login
        </button>
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
        <p className="text-[16px] font-semibold text-[#1a1a1a]">Application not found</p>
        <p className="mt-2 text-[14px] text-[#5a5a5a]">
          It may have been removed or you don’t have access.
        </p>
        <Link
          href="/admissions/my-admissions"
          className="mt-6 inline-block rounded-md bg-[#3f79b5] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#356e9f]"
        >
          Back to My admissions
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-8 py-10 text-center text-[14px] text-red-800">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const extra =
    data.extra_data && Object.keys(data.extra_data).length > 0
      ? JSON.stringify(data.extra_data, null, 2)
      : null;

  const paymentPending = (data.payment_status ?? "").toUpperCase().includes("PENDING");

  return (
    <div className="mt-6 space-y-6">
      {data.is_deleted ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
        >
          This application is marked as deleted in the system.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
            Undergraduate application
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[28px] font-bold tracking-tight text-[#1a1a1a]">
              Admission №{" "}
              <span className="font-mono text-[#2f76b7]">{data.admission_number}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={data.current_status} kind="status" />
              <StatusBadge value={data.payment_status} kind="payment" />
            </div>
          </div>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">
            {termText(data.admission_term)}
          </p>
        </div>

        <dl className="px-8 pb-2 pt-2">
          {(() => {
            const applicantName = [data.applicant_first_name, data.applicant_last_name]
              .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
              .join(" ")
              .trim();
            return applicantName ? (
              <DetailRow label="Applicant">{applicantName}</DetailRow>
            ) : null;
          })()}
          {data.applicant_email ? (
            <DetailRow label="Email">
              <a
                href={`mailto:${data.applicant_email}`}
                className="text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
              >
                {data.applicant_email}
              </a>
            </DetailRow>
          ) : null}
          <DetailRow label="Admission term">{termText(data.admission_term)}</DetailRow>
          <DetailRow label="Sponsorship">{data.sponsorship_type}</DetailRow>
          <DetailRow label="Stream">{data.stream}</DetailRow>
          <DetailRow label="Final decision">
            {data.final_decision && data.final_decision !== "string"
              ? data.final_decision
              : "—"}
          </DetailRow>
          <DetailRow label="Remarks">
            {data.remarks && data.remarks !== "string" ? data.remarks : "—"}
          </DetailRow>
        </dl>

        {paymentPending ? (
          <div className="border-t border-gray-100 bg-amber-50/50 px-8 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-amber-900">
                  Payment is pending for this application
                </p>
                <p className="mt-1 text-[12px] text-amber-800">
                  Complete payment to proceed with credential verification.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartPayment}
                disabled={paymentStartLoading}
                className="h-[40px] rounded-md bg-[#3f79b5] px-5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#356e9f] disabled:opacity-60"
              >
                {paymentStartLoading ? "Starting…" : "Pay now"}
              </button>
            </div>
            {paymentError ? (
              <p
                role="alert"
                className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800"
              >
                {paymentError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {(data.current_status ?? "").toUpperCase() === "CHANGES_REQUESTED" ? (
        <div className="overflow-hidden rounded-xl border border-[#f4d7aa] bg-[#fffaf0] shadow-sm">
          <div className="border-b border-[#f0dfbf] bg-[#fff3df] px-8 py-4">
            <h2 className="text-[15px] font-bold text-[#9a5b00]">Corrections Required</h2>
            <p className="mt-1 text-[13px] text-[#7a5a2c]">
              You are requested to enter the following informations correctly.
            </p>
          </div>

          {correctionContextLoading ? (
            <div className="border-b border-[#f0dfbf] px-8 py-4 text-[12.5px] text-[#7a5a2c]">
              Loading the reason for requested changes…
            </div>
          ) : correctionContext &&
            (correctionContext.officer_note ||
              correctionContext.agent_summary ||
              correctionContext.reasoning_steps.length > 0) ? (
            <div className="space-y-4 border-b border-[#f0dfbf] px-8 py-5">
              <div>
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-[#9a5b00]">
                  Why we requested changes
                </h3>
                <p className="mt-1 text-[12.5px] text-[#7a5a2c]">
                  Use this overview to understand what to fix before
                  resubmitting.
                </p>
              </div>

              {correctionContext.officer_note ? (
                <div className="rounded-md border border-[#e6d3a8] bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a5b00]">
                    Officer&apos;s note
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#1a1a1a]">
                    {correctionContext.officer_note}
                  </p>
                </div>
              ) : null}

              {correctionContext.agent_summary ? (
                <div className="rounded-md border border-[#e6d3a8] bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a5b00]">
                    Review summary
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#1a1a1a]">
                    {correctionContext.agent_summary}
                  </p>
                </div>
              ) : null}

              {correctionContext.reasoning_steps.length > 0 ? (
                <div className="rounded-md border border-[#e6d3a8] bg-white px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#9a5b00]">
                    What the review checked
                  </p>
                  <ul className="mt-2 space-y-3">
                    {correctionContext.reasoning_steps.map((step, idx) => (
                      <li key={`${step.label}-${idx}`}>
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">
                          {step.label}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#3a3a3a]">
                          {step.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4 px-8 py-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="correction-admission-number" className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]">
                  Admission Number
                </label>
                <input
                  id="correction-admission-number"
                  value={correctionAdmissionNumber}
                  onChange={(e) => setCorrectionAdmissionNumber(e.target.value)}
                  required
                  className="h-[40px] w-full rounded-md border border-[#d2c3a8] bg-white px-3 text-[14px] text-[#1a1a1a] outline-none focus:border-[#3f79b5] focus:ring-2 focus:ring-[#3f79b5]/25"
                />
              </div>
              <div>
                <label htmlFor="correction-stream" className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]">
                  Stream
                </label>
                <select
                  id="correction-stream"
                  value={correctionStream}
                  onChange={(e) => setCorrectionStream(e.target.value as "NATURAL" | "SOCIAL" | "")}
                  required
                  className="h-[40px] w-full rounded-md border border-[#d2c3a8] bg-white px-3 text-[14px] text-[#1a1a1a] outline-none focus:border-[#3f79b5] focus:ring-2 focus:ring-[#3f79b5]/25"
                >
                  <option value="" disabled>Select stream</option>
                  <option value="NATURAL">Natural</option>
                  <option value="SOCIAL">Social</option>
                </select>
              </div>
              <div>
                <label htmlFor="correction-first-name" className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]">
                  First Name
                </label>
                <input
                  id="correction-first-name"
                  value={correctionFirstName}
                  onChange={(e) => setCorrectionFirstName(e.target.value)}
                  required
                  className="h-[40px] w-full rounded-md border border-[#d2c3a8] bg-white px-3 text-[14px] text-[#1a1a1a] outline-none focus:border-[#3f79b5] focus:ring-2 focus:ring-[#3f79b5]/25"
                />
              </div>
              <div>
                <label htmlFor="correction-last-name" className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]">
                  Last Name
                </label>
                <input
                  id="correction-last-name"
                  value={correctionLastName}
                  onChange={(e) => setCorrectionLastName(e.target.value)}
                  required
                  className="h-[40px] w-full rounded-md border border-[#d2c3a8] bg-white px-3 text-[14px] text-[#1a1a1a] outline-none focus:border-[#3f79b5] focus:ring-2 focus:ring-[#3f79b5]/25"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSubmitCorrections}
                disabled={correctionLoading}
                className="h-[40px] rounded-md bg-[#3f79b5] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#356e9f] disabled:opacity-60"
              >
                {correctionLoading ? "Submitting..." : "Submit Corrections"}
              </button>
            </div>

            {correctionError ? (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800"
              >
                {correctionError}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <h2 className="text-[15px] font-bold text-[#2a66a7]">Program choices</h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">
            First, second, and third preferences from your submitted application.
          </p>
        </div>
        <dl className="px-8 pb-4">
          <DetailRow label="1st choice">
            <ProgramChoiceDisplay
              program={data.program_choice_1}
              fallbackId={data.program_choice_1?.id ?? data.program_choice_1_id ?? "—"}
            />
          </DetailRow>
          <DetailRow label="2nd choice">
            <ProgramChoiceDisplay
              program={data.program_choice_2}
              fallbackId={data.program_choice_2?.id ?? data.program_choice_2_id ?? "—"}
            />
          </DetailRow>
          <DetailRow label="3rd choice">
            <ProgramChoiceDisplay
              program={data.program_choice_3}
              fallbackId={data.program_choice_3?.id ?? data.program_choice_3_id ?? "—"}
            />
          </DetailRow>
        </dl>
      </div>

   

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#2a66a7]">UAT result</h2>
            <p className="mt-1 text-[12px] text-[#5a5a5a]">
              Look up the testing center result tied to this application.
            </p>
          </div>
        </div>
        <div className="px-8 py-4">
          {uatLoading ? (
            <p className="mt-2 text-[13px] text-[#5a5a5a]">Checking UAT result...</p>
          ) : null}
          {uatError ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800" role="alert">
              {uatError}
            </div>
          ) : null}
          {uatResult ? (
            <>
              <DetailRow label="Score">
                <span className="font-mono text-[14px] font-semibold text-[#1a1a1a]">
                  {uatResult.score}
                </span>
              </DetailRow>
             
            </>
          ) : !data.uat_id ? (
            <p className="mt-2 text-[13px] text-[#5a5a5a]">
            The Applicant has not taken the UAT test yet.
          </p>
          ) : null}
        </div>
      </div>

      {(data.current_status ?? "").toUpperCase() === "ENROLLED" ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
            <h2 className="text-[15px] font-bold text-[#2a66a7]">Enrollment</h2>
            <p className="mt-1 text-[12px] text-[#5a5a5a]">
              You are enrolled. This is your university student ID.
            </p>
          </div>
          <div className="px-8 py-4">
            {enrollmentLoading ? (
              <p className="mt-2 text-[13px] text-[#5a5a5a]">Loading enrollment…</p>
            ) : enrollment ? (
              <>
                <DetailRow label="University ID">
                  <span className="font-mono text-[14px] font-semibold text-[#1a1a1a]">
                    {enrollment.university_id}
                  </span>
                </DetailRow>
                <DetailRow label="Department">{enrollment.department ?? "—"}</DetailRow>
                <DetailRow label="Enrollment term">{enrollment.enrollment_term ?? "—"}</DetailRow>
              </>
            ) : (
              <p className="mt-2 text-[13px] text-[#5a5a5a]">
                Enrollment record is being prepared. Check back shortly.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {extra ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
            <h2 className="text-[15px] font-bold text-[#2a66a7]">Extra data</h2>
          </div>
          <pre className="max-h-[320px] overflow-auto px-8 py-4 font-mono text-[11px] leading-relaxed text-[#3a3a3a]">
            {extra}
          </pre>
        </div>
      ) : null}

      {paymentModalOpen && paymentInit ? (
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
            aria-labelledby="detail-payment-dialog-title"
            className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-5">
              <h2 id="detail-payment-dialog-title" className="text-[18px] font-bold text-[#2a66a7]">
                Finish payment
              </h2>
              <p className="mt-1 text-[13px] text-[#5a5a5a]">
                Use the reference below with your payment provider, then confirm.
              </p>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div>
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
              </div>

              {paymentInit.payment_url ? (
                <a
                  href={paymentInit.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[13px] font-semibold text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
                >
                  Open payment provider in a new tab
                </a>
              ) : null}

              <div>
                <label
                  htmlFor="detail-modal-payment-ref"
                  className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]"
                >
                  Confirm payment reference
                </label>
                <input
                  id="detail-modal-payment-ref"
                  type="text"
                  value={modalPaymentRef}
                  onChange={(e) => setModalPaymentRef(e.target.value)}
                  className="w-full rounded-lg border border-[#9bb0cc] bg-[#eef4ff] px-3 py-2.5 text-[14px] text-[#1a1a1a] outline-none focus:border-[#2f76b7] focus:ring-2 focus:ring-[#2f76b7]/25"
                  placeholder="Paste or enter reference"
                  autoComplete="off"
                />
              </div>

              {paymentError ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800"
                >
                  {paymentError}
                </p>
              ) : null}

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

      {correctionSuccessModalOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCorrectionSuccessModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="correction-success-dialog-title"
            className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-5">
              <h2 id="correction-success-dialog-title" className="text-[18px] font-bold text-[#2a66a7]">
                Corrections Submitted
              </h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="text-[14px] text-[#1a1a1a]">
                Your correction request was submitted successfully.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setCorrectionSuccessModalOpen(false)}
                  className="h-[40px] rounded-md bg-[#3f79b5] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#356e9f]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-white px-8 py-5 text-[12px] text-[#5a5a5a] shadow-sm">
        <div>
          <span className="font-semibold text-[#3a3a3a]">Created</span>
          <br />
          {data.created_at
            ? new Date(data.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </div>
        <div>
          <span className="font-semibold text-[#3a3a3a]">Last updated</span>
          <br />
          {data.updated_at
            ? new Date(data.updated_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </div>
      </div>
    </div>
  );
}
