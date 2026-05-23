"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import {
  ApiError,
  fetchMyTranscript,
  formatGradeLetter,
  type TranscriptCourseEntry,
  type TranscriptResponse,
  type TranscriptTermEntry,
} from "@/lib/api";
import { useEffect, useState } from "react";

function formatPhase(phase: string): string {
  if (!phase) return phase;
  return phase.charAt(0).toUpperCase() + phase.slice(1).toLowerCase();
}

function formatNumber(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function termHeading(term: TranscriptTermEntry): string {
  return `Academic Year : ${term.term_name},   Semester : ${formatPhase(term.term_phase)}`;
}

const STATUS_LABEL: Record<string, string> = {
  PROMOTED: "Promoted",
  WARNING: "Warning (probation)",
  DISMISSED: "Dismissed",
  INCOMPLETE: "Incomplete (held for review)",
  DISTINCTION: "Distinction",
};

// Authoritative status comes from the authorised standing (Track C).
// Until the department head authorises the term it's null — fall back to
// a provisional GPA-based label so the row isn't blank.
function academicStatus(
  termGpa: number | null,
  authorisedStatus: string | null,
): string {
  if (authorisedStatus) return STATUS_LABEL[authorisedStatus] ?? authorisedStatus;
  if (termGpa == null) return "—";
  return `${termGpa >= 2.0 ? "Promoted" : "Probation"} (provisional)`;
}

function AssessmentResultModal({
  course,
  onClose,
}: {
  course: TranscriptCourseEntry;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const components = course.has_breakdown ? course.components : [];
  const totalRaw = components.reduce((s, c) => s + (c.score ?? 0), 0);
  const totalMax = components.reduce((s, c) => s + c.max_score, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-result-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] overflow-hidden rounded-[6px] border border-[#d9d9d9] bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#e4e4e4] px-5 py-3">
          <h2
            id="assessment-result-title"
            className="text-[18px] font-semibold text-[#1f1f1f]"
          >
            Assessment Result
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[20px] leading-none text-[#5a5a5a] hover:text-[#1f1f1f]"
          >
            ×
          </button>
        </div>

        {/* Course label */}
        <div className="px-5 py-3 text-[15px] font-semibold text-[#3d77a8]">
          Course : {course.course_title}
        </div>

        {/* Result table */}
        {components.length === 0 ? (
          <p className="px-5 pb-5 text-[13px] italic text-[#5a5a5a]">
            Legacy grade — no per-component breakdown is available for this
            course.
          </p>
        ) : (
          <div className="pb-5">
            <table className="w-full border-collapse text-[14px]">
              <colgroup>
                <col className="w-[64px]" />
                <col />
                <col className="w-[88px]" />
              </colgroup>
              <thead>
                <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] text-left text-[#1f1f1f]">
                  <th className="border border-[#d9d9d9] px-3 py-2 font-semibold">
                    S.No.
                  </th>
                  <th className="border border-[#d9d9d9] px-4 py-2 font-semibold">
                    Assessment
                  </th>
                  <th className="border border-[#d9d9d9] px-3 py-2 font-semibold">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {components.map((c, idx) => (
                  <tr
                    key={`${course.course_id}-${idx}`}
                    className={idx % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}
                  >
                    <td className="border border-[#d9d9d9] px-3 py-2">
                      {idx + 1}
                    </td>
                    <td className="border border-[#d9d9d9] px-4 py-2">
                      {c.name} ( {c.weight}% )
                    </td>
                    <td className="border border-[#d9d9d9] px-3 py-2 tabular-nums">
                      {c.score == null ? "—" : c.score}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] text-[#1f1f1f]">
                  <td
                    colSpan={3}
                    className="border border-[#d9d9d9] px-4 py-2 text-right font-semibold"
                  >
                    Total Mark : {formatNumber(totalRaw, totalRaw % 1 === 0 ? 0 : 2)} / {totalMax}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-[#e4e4e4] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] border border-[#bdbdbd] bg-white px-4 py-1.5 text-[13px] font-semibold text-[#3a3a3a] hover:bg-[#f1f3f5]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GradeReportPage() {
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] =
    useState<TranscriptCourseEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMyTranscript()
      .then((data) => {
        if (!cancelled) setTranscript(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setError("Only enrolled students can view the transcript.");
        } else if (err instanceof ApiError) {
          setError(err.message || `Could not load transcript (HTTP ${err.status}).`);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Could not load transcript.");
        }
        setTranscript(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute SGP (sum of grade_points × credit_hours) per term and the
  // running cumulative CGP, so the per-semester stats box matches the
  // legacy layout (SGP / SGPA / CGP / CGPA).
  const terms = transcript?.terms ?? [];
  // Backend returns terms newest-first; for a meaningful running CGP we
  // walk oldest → newest to accumulate, then render in the API order.
  const orderedAsc = [...terms].reverse();
  const cumulative = new Map<string, { cgp: number; credits: number }>();
  let runCgp = 0;
  let runCredits = 0;
  for (const t of orderedAsc) {
    let sgp = 0;
    let credits = 0;
    for (const c of t.courses) {
      const gp = c.grade_points ?? 0;
      sgp += gp * c.credit_hours;
      credits += c.credit_hours;
    }
    runCgp += sgp;
    runCredits += credits;
    cumulative.set(t.term_id, { cgp: runCgp, credits: runCredits });
  }

  const hasGrades = transcript != null && terms.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 px-3 md:mx-[150px] md:px-0">
            <div className="bg-white">
              <div className="border-b border-[#e4e4e4] pb-1">
                <h1 className="text-[24px] font-semibold">My Grade Report</h1>
              </div>

              <div className="py-4 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                {loading ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
                    <p className="text-[13px] text-[#5a5a5a]">Loading transcript…</p>
                  </div>
                ) : error ? (
                  <p className="rounded-lg border border-[#f0bcbc] bg-[linear-gradient(180deg,#fdebeb_0%,#f8d3d3_100%)] px-4 py-6 text-center text-[14px] font-semibold text-[#a31a1a]">
                    {error}
                  </p>
                ) : !hasGrades ? (
                  <p className="rounded-lg border border-gray-200 bg-[#f8fafc] px-4 py-8 text-center text-[14px] text-[#5a5a5a]">
                    No authorised grades to display yet — your transcript will fill
                    in as departments authorise each term&apos;s batch.
                  </p>
                ) : (
                  <>
                    <table className="w-full min-w-[720px] border-collapse text-[16px]">
                      <thead>
                        <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] text-[#1f1f1f] shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            No.
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            Course Title
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            Code
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            Credit Hour
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            Numeric
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            Grade
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">
                            Assessment
                          </th>
                        </tr>
                      </thead>
                    </table>

                    <div className="min-w-[720px] overflow-hidden rounded-b-[4px] border border-t-0 border-[#d9d9d9]">
                      {terms.map((term) => {
                        const totals = cumulative.get(term.term_id) ?? {
                          cgp: 0,
                          credits: 0,
                        };
                        const sgp = term.courses.reduce(
                          (s, c) => s + (c.grade_points ?? 0) * c.credit_hours,
                          0,
                        );
                        return (
                          <div
                            key={term.term_id}
                            className="border-b border-[#e4e4e4] last:border-b-0"
                          >
                            <div className="px-4 pt-6 pb-6 text-[15px] font-semibold text-[#3d77a8] md:px-[30px] md:pt-[40px] md:pb-[50px] md:text-[16px]">
                              {termHeading(term)}
                            </div>

                            {term.courses.length === 0 ? (
                              <p className="px-4 pb-6 text-[14px] italic text-[#5a5a5a] md:px-[30px]">
                                No authorised grades for this term yet.
                              </p>
                            ) : (
                              <table className="w-full border-collapse text-[16px]">
                                <tbody>
                                  {term.courses.map((course, idx) => {
                                    const baseRowClass =
                                      idx % 2 === 0 ? "bg-[#efefef]" : "bg-[#ffffff]";
                                    return (
                                      <tr key={course.course_id} className={baseRowClass}>
                                        <td className="border border-[#d9d9d9] p-[14px]">
                                          {idx + 1}
                                        </td>
                                        <td className="border border-[#d9d9d9] p-[14px]">
                                          {course.course_title}
                                        </td>
                                        <td className="border border-[#d9d9d9] p-[14px]">
                                          {course.course_code}
                                        </td>
                                        <td className="border border-[#d9d9d9] p-[14px]">
                                          {course.credit_hours.toFixed(2)}
                                        </td>
                                        <td className="border border-[#d9d9d9] p-[14px]">
                                          {formatNumber(course.numeric_score)}
                                        </td>
                                        <td className="border border-[#d9d9d9] p-[14px] font-semibold">
                                          {formatGradeLetter(course.letter_grade)}
                                        </td>
                                        <td className="border border-[#d9d9d9] p-[14px]">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedCourse(course)}
                                            className="px-5 cursor-pointera hover:underline"
                                          >
                                            Assessment
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}

                            <div className="m-4 rounded-[8px] border border-[#dedede] bg-[#ffffff] px-4 py-2 md:my-[50px] md:px-[80px]">
                              <div className="inline-grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2 md:gap-x-[100px]">
                                <p className="font-semibold">
                                  SGP : {formatNumber(sgp)}
                                </p>
                                <p className="font-semibold">
                                  SGPA : {formatNumber(term.term_gpa)}
                                </p>
                                <p className="font-semibold">
                                  CGP : {formatNumber(totals.cgp)}
                                </p>
                                <p className="font-semibold">
                                  CGPA :{" "}
                                  {formatNumber(
                                    totals.credits > 0
                                      ? totals.cgp / totals.credits
                                      : null,
                                  )}
                                </p>
                              </div>
                              <p className="mt-6 font-semibold">
                                Academic Status :{" "}
                                {academicStatus(term.term_gpa, term.academic_status)}
                                {term.academic_status_authorised_at ? (
                                  <span className="ml-2 text-[12px] font-normal text-[#5a5a5a]">
                                    (authorised{" "}
                                    {new Date(
                                      term.academic_status_authorised_at,
                                    ).toLocaleDateString()}
                                    )
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {selectedCourse ? (
        <AssessmentResultModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      ) : null}

      <PortalFooter />
    </div>
  );
}
