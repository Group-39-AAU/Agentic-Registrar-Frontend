"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  callbackRegistrationPayment,
  fetchAvailableCourses,
  fetchRegistrationInvoice,
  fetchStudentMe,
  initiateRegistrationPayment,
  registerForCourses,
  type AvailableCoursesResponse,
  type RegistrationInvoice,
  type RegistrationPaymentInitiateResponse,
  type StudentMeResponse,
} from "@/lib/api";

const ROMAN_YEAR = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function semesterToYear(currentSemester: number): string {
  if (!currentSemester || currentSemester < 1) return "";
  const year = Math.ceil(currentSemester / 2);
  return ROMAN_YEAR[year - 1] ?? String(year);
}

// TopStrip moved to shared component PortalTopStrip.

export default function RegisteredCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const termId = searchParams.get("termId") || "";

  const [profile, setProfile] = useState<StudentMeResponse | null>(null);
  const [available, setAvailable] = useState<AvailableCoursesResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [paymentStep, setPaymentStep] =
    useState<"idle" | "loading" | "invoice" | "confirm">("idle");
  const [invoice, setInvoice] = useState<RegistrationInvoice | null>(null);
  const [paymentInit, setPaymentInit] =
    useState<RegistrationPaymentInitiateResponse | null>(null);
  const [paymentRefInput, setPaymentRefInput] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStudentMe()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!termId) {
      setLoadError("No term selected. Please go back and pick an academic year and semester.");
      return;
    }
    let cancelled = false;
    setLoadError(null);
    fetchAvailableCourses(termId)
      .then((data) => {
        if (cancelled) return;
        setAvailable(data);
        setSelectedCourseIds([]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        let message: string;
        if (err instanceof ApiError) {
          message =
            err.message && err.message !== "Request failed"
              ? `${err.status}: ${err.message}`
              : `Request failed with status ${err.status}`;
        } else if (err instanceof Error) {
          message = err.message;
        } else {
          message = "Failed to load available courses.";
        }
        setLoadError(message);
        setAvailable(null);
      });
    return () => {
      cancelled = true;
    };
  }, [termId]);

  const yearLabel = profile ? semesterToYear(profile.current_semester) : "";

  const isOpen = available?.term?.is_open ?? false;
  const isRegistered = available?.is_registered ?? false;
  const isPaymentHold =
    isOpen && isRegistered && available?.registration_status === "PAYMENT_HOLD";
  const registrationId = available?.registration_id ?? null;
  const courses = available?.courses ?? [];

  const showRegisterTable = isOpen && !isRegistered;
  const showPaymentHoldTable = isPaymentHold;
  const showRegisteredTable = isRegistered && !isPaymentHold;
  const showClosedMessage = available !== null && !isOpen && !isRegistered;

  const allSelected =
    courses.length > 0 && selectedCourseIds.length === courses.length;

  const totalCreditHours = useMemo(() => {
    if (showRegisteredTable) {
      return courses.reduce((sum, course) => sum + (course.credit_hours ?? 0), 0);
    }
    return courses
      .filter((course) => selectedCourseIds.includes(course.id))
      .reduce((sum, course) => sum + (course.credit_hours ?? 0), 0);
  }, [courses, selectedCourseIds, showRegisteredTable]);

  function toggleCourse(courseId: string) {
    setSelectedCourseIds((previous) =>
      previous.includes(courseId)
        ? previous.filter((id) => id !== courseId)
        : [...previous, courseId],
    );
  }

  function toggleAllCourses() {
    setSelectedCourseIds(allSelected ? [] : courses.map((course) => course.id));
  }

  function describeError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      return err.message && err.message !== "Request failed"
        ? `${err.status}: ${err.message}`
        : `Request failed with status ${err.status}`;
    }
    if (err instanceof Error) return err.message;
    return fallback;
  }

  async function handleSubmit() {
    if (!termId || selectedCourseIds.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await registerForCourses(termId, selectedCourseIds);
      const refreshed = await fetchAvailableCourses(termId);
      setAvailable(refreshed);
      setSelectedCourseIds([]);
    } catch (err: unknown) {
      setSubmitError(describeError(err, "Failed to submit registration."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleProceedToPayment() {
    if (!registrationId || paymentBusy) return;
    setPaymentError(null);
    setPaymentBusy(true);
    setPaymentStep("loading");
    try {
      const invoiceData = await fetchRegistrationInvoice(registrationId);
      setInvoice(invoiceData);
      const init = await initiateRegistrationPayment(registrationId);
      setPaymentInit(init);
      setPaymentRefInput(init.payment_reference);
      setPaymentStep("confirm");
    } catch (err: unknown) {
      setPaymentError(describeError(err, "Could not start payment."));
      setPaymentStep("idle");
    } finally {
      setPaymentBusy(false);
    }
  }

  async function handleConfirmPayment() {
    if (!registrationId || !paymentInit || paymentBusy) return;
    const ref = paymentRefInput.trim();
    if (!ref) {
      setPaymentError("Enter the payment reference.");
      return;
    }
    setPaymentError(null);
    setPaymentBusy(true);
    try {
      await callbackRegistrationPayment(registrationId, {
        payment_reference: ref,
      });
      closePaymentModal();
      router.push("/portal/course-registration?registered=1");
    } catch (err: unknown) {
      setPaymentError(describeError(err, "Payment confirmation failed."));
    } finally {
      setPaymentBusy(false);
    }
  }

  function closePaymentModal() {
    setPaymentStep("idle");
    setInvoice(null);
    setPaymentInit(null);
    setPaymentRefInput("");
    setPaymentError(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] md:pr-[130px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 md:ml-[130px]">
            <div className="px-3 py-1 text-[16px] md:px-2">
              <div className="md:max-w-[995px]">
                <h1 className="mb-2 border-b border-[#e0e0e0] pb-2 text-[22px] font-semibold text-[#222] md:text-[24px]">Course Registration</h1>

                <div className="grid grid-cols-[120px_1fr] gap-y-2 px-1 md:grid-cols-[180px_360px_160px_1fr] md:px-4">
                  <p className="font-semibold">Full Name</p>
                  <p>{profile?.full_name ?? "—"}</p>
                  <p className="font-semibold">Class Year</p>
                  <p>{yearLabel ? `Year ${yearLabel} , Section` : "—"}</p>

                  <p className="font-semibold">ID No.</p>
                  <p>{profile?.student_id ?? "—"}</p>
                  <p className="font-semibold">Admission Type</p>
                  <p>Regular</p>

                  <p className="self-center font-semibold">Program</p>
                  <p className="w-[324px]">{profile?.department ?? "—"}</p>
                  <p className="font-semibold">Due Amount</p>
                  <p>-</p>
                </div>

                {loadError ? (
                  <p className="mt-6 text-center text-[16px] font-semibold text-[#c0392b]">
                    {loadError}
                  </p>
                ) : null}

                {showClosedMessage ? (
                  <p className="mt-6 text-center text-[16px] font-semibold text-[#c0392b]">
                    Registration is closed
                  </p>
                ) : null}

                {showPaymentHoldTable ? (
                  <>
                    <p className="my-6 mb-6 ml-[20px] text-[16px] font-semibold italic text-[#c97a2a]">
                      Your registration is on payment hold. Proceed to payment to confirm.
                    </p>

                    <div className="-mx-3 overflow-x-auto md:mx-0">
                      <table className="w-full min-w-[640px] border-collapse text-[16px] text-[#1f1f1f]">
                        <thead>
                          <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
                            <th className="border border-[#d9d9d9] p-[12px] text-left">No.</th>
                            <th className="border border-[#d9d9d9] p-[12px] text-left">Course Title</th>
                            <th className="border border-[#d9d9d9] p-[12px] text-left">Course Code</th>
                            <th className="border border-[#d9d9d9] p-[12px] text-left">Department</th>
                            <th className="border border-[#d9d9d9] p-[12px] text-left">Credit Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {courses.map((course, idx) => (
                            <tr key={course.id} className={idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#e3e3e3]"}>
                              <td className="border border-[#d9d9d9] p-[12px]">{idx + 1}</td>
                              <td className="border border-[#d9d9d9] p-[12px]">{course.title}</td>
                              <td className="border border-[#d9d9d9] p-[12px]">{course.code}</td>
                              <td className="border border-[#d9d9d9] p-[12px]">{course.department}</td>
                              <td className="border border-[#d9d9d9] p-[12px]">{course.credit_hours}</td>
                            </tr>
                          ))}
                          <tr className="bg-[linear-gradient(180deg,#e2ecf6_0%,#cfddec_100%)] font-semibold">
                            <td colSpan={4} className="border border-[#d9d9d9] px-2 py-2 text-center">
                              Total Credit Hours
                            </td>
                            <td className="border border-[#d9d9d9] px-2 py-2">{totalCreditHours}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {paymentError ? (
                      <p className="mt-4 text-center text-[16px] font-semibold text-[#c0392b]">
                        {paymentError}
                      </p>
                    ) : null}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        disabled={paymentBusy}
                        onClick={handleProceedToPayment}
                        className="rounded-md bg-[linear-gradient(180deg,#3a86c4_0%,#2f78b7_100%)] px-6 py-2 text-[16px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_18px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 enabled:hover:bg-[linear-gradient(180deg,#2f78b7_0%,#255f93_100%)] enabled:hover:-translate-y-[1px] enabled:hover:shadow-[0_2px_0_rgba(255,255,255,0.2)_inset,0_14px_22px_-12px_rgba(31,91,148,0.85)] disabled:cursor-not-allowed disabled:bg-[#9ab9d5] disabled:shadow-none"
                      >
                        {paymentBusy ? "Loading…" : "Proceed to Payment"}
                      </button>
                    </div>
                  </>
                ) : null}

                {showRegisteredTable ? (
                  <>
                    <p className="my-6 mb-6 ml-[20px] text-[16px] font-semibold italic text-[#2f78b7]">
                      You have been registered to the following courses !
                    </p>

                    <div className="-mx-3 overflow-x-auto md:mx-0">
                    <table className="w-full min-w-[640px] border-collapse text-[16px] text-[#1f1f1f]">
                      <thead>
                        <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
                          <th className="border border-[#d9d9d9] p-[12px] text-left">No.</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Title</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Code</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Department</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Credit Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course, idx) => (
                          <tr key={course.id} className={idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#e3e3e3]"}>
                            <td className="border border-[#d9d9d9] p-[12px]">{idx + 1}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.title}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.code}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.department}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.credit_hours}</td>
                          </tr>
                        ))}
                        <tr className="bg-[linear-gradient(180deg,#e2ecf6_0%,#cfddec_100%)] font-semibold">
                          <td colSpan={4} className="border border-[#d9d9d9] px-2 py-2 text-center">
                            Total Credit Hours
                          </td>
                          <td className="border border-[#d9d9d9] px-2 py-2">{totalCreditHours}</td>
                        </tr>
                      </tbody>
                    </table>
                    </div>
                  </>
                ) : null}

                {showRegisterTable ? (
                  <>
                    <div className="-mx-3 overflow-x-auto md:mx-0">
                    <table className="mt-10 w-full min-w-[720px] border-collapse text-[16px] text-[#1f1f1f]">
                      <thead>
                        <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
                          <th className="border border-[#d9d9d9] p-[12px] text-left">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={toggleAllCourses}
                              className="h-4 w-4 cursor-pointer"
                            />
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">No.</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Title</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Code</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Department</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Credit Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course, idx) => (
                          <tr key={course.id} className={idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#e3e3e3]"}>
                            <td className="border border-[#d9d9d9] p-[12px]">
                              <input
                                type="checkbox"
                                checked={selectedCourseIds.includes(course.id)}
                                onChange={() => toggleCourse(course.id)}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </td>
                            <td className="border border-[#d9d9d9] p-[12px]">{idx + 1}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.title}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.code}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.department}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.credit_hours}</td>
                          </tr>
                        ))}
                        <tr className="bg-[linear-gradient(180deg,#e2ecf6_0%,#cfddec_100%)] font-semibold">
                          <td className="border border-[#d9d9d9] p-[12px]"></td>
                          <td colSpan={4} className="border border-[#d9d9d9] p-[12px] text-center">
                            Total Credit Hours
                          </td>
                          <td className="border border-[#d9d9d9] p-[12px]">{totalCreditHours}</td>
                        </tr>
                      </tbody>
                    </table>
                    </div>

                    {submitError ? (
                      <p className="mt-4 text-center text-[16px] font-semibold text-[#c0392b]">
                        {submitError}
                      </p>
                    ) : null}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        disabled={selectedCourseIds.length === 0 || submitting}
                        onClick={handleSubmit}
                        className="rounded-md bg-[linear-gradient(180deg,#3a86c4_0%,#2f78b7_100%)] px-6 py-2 text-[16px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_18px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 enabled:hover:bg-[linear-gradient(180deg,#2f78b7_0%,#255f93_100%)] enabled:hover:-translate-y-[1px] enabled:hover:shadow-[0_2px_0_rgba(255,255,255,0.2)_inset,0_14px_22px_-12px_rgba(31,91,148,0.85)] disabled:cursor-not-allowed disabled:bg-[#9ab9d5] disabled:shadow-none"
                      >
                        {submitting ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>

      {paymentStep !== "idle" ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !paymentBusy) closePaymentModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-dialog-title"
            className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-5">
              <div>
                <h2
                  id="payment-dialog-title"
                  className="text-[18px] font-bold text-[#2a66a7]"
                >
                  Course registration payment
                </h2>
                <p className="mt-1 text-[13px] text-[#5a5a5a]">
                  Review your invoice and confirm payment to finalize registration.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close payment dialog"
                onClick={() => {
                  if (!paymentBusy) closePaymentModal();
                }}
                className="grid h-8 w-8 place-items-center rounded text-[#5a5a5a] hover:bg-black/5 disabled:opacity-40"
                disabled={paymentBusy}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              {paymentStep === "loading" ? (
                <p className="py-10 text-center text-[14px] text-[#5a5a5a]">
                  Preparing your invoice…
                </p>
              ) : null}

              {invoice ? (
                <div className="rounded-xl border border-gray-200 bg-[#fafbfc] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[#2f76b7]">
                    Invoice
                  </p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[420px] border-collapse text-[13px] text-[#1f1f1f]">
                      <thead>
                        <tr className="bg-[#eef2f6] text-left">
                          <th className="border border-[#dadfe5] px-2 py-1">Code</th>
                          <th className="border border-[#dadfe5] px-2 py-1">Title</th>
                          <th className="border border-[#dadfe5] px-2 py-1 text-right">Cr.</th>
                          <th className="border border-[#dadfe5] px-2 py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.lines.map((line) => (
                          <tr key={line.course_id}>
                            <td className="border border-[#dadfe5] px-2 py-1">{line.course_code}</td>
                            <td className="border border-[#dadfe5] px-2 py-1">{line.course_title}</td>
                            <td className="border border-[#dadfe5] px-2 py-1 text-right">{line.credit_hours}</td>
                            <td className="border border-[#dadfe5] px-2 py-1 text-right">
                              {line.line_total} {invoice.currency}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-y-1 text-[13px]">
                    <p className="font-semibold">Total credit hours</p>
                    <p className="text-right">{invoice.total_credit_hours}</p>
                    <p className="font-semibold">Fee per credit hour</p>
                    <p className="text-right">{invoice.fee_per_credit_hour} {invoice.currency}</p>
                    <p className="font-semibold">Gross total</p>
                    <p className="text-right">{invoice.gross_total} {invoice.currency}</p>
                    <p className="font-semibold text-[#2a66a7]">Amount due</p>
                    <p className="text-right font-semibold text-[#2a66a7]">
                      {invoice.amount_due} {invoice.currency}
                    </p>
                  </div>
                  {invoice.note ? (
                    <p className="mt-3 text-[12px] italic text-[#5a5a5a]">{invoice.note}</p>
                  ) : null}
                </div>
              ) : null}

              {paymentInit ? (
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                      Payment reference
                    </p>
                    <code className="mt-1 inline-block break-all rounded-md bg-[#f1f5f9] px-3 py-2 font-mono text-[12px] text-[#1a1a1a]">
                      {paymentInit.payment_reference}
                    </code>
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
                      htmlFor="payment-ref-input"
                      className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]"
                    >
                      Confirm reference
                    </label>
                    <input
                      id="payment-ref-input"
                      type="text"
                      value={paymentRefInput}
                      onChange={(e) => setPaymentRefInput(e.target.value)}
                      className="w-full rounded-lg border border-[#9bb0cc] bg-[#eef4ff] px-3 py-2 text-[14px] text-[#1a1a1a] outline-none focus:border-[#2f76b7] focus:ring-2 focus:ring-[#2f76b7]/25"
                      autoComplete="off"
                    />
                  </div>
                </div>
              ) : null}

              {paymentError ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800"
                >
                  {paymentError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePaymentModal}
                disabled={paymentBusy}
                className="h-[40px] rounded-lg border border-gray-300 px-5 text-[14px] font-semibold text-gray-700 hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paymentBusy || paymentStep !== "confirm"}
                className="h-[40px] min-w-[140px] rounded-lg bg-[#2f78b7] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#255f93] disabled:cursor-not-allowed disabled:bg-[#9ab9d5]"
              >
                {paymentBusy ? "Processing…" : "Confirm payment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PortalFooter />
    </div>
  );
}
