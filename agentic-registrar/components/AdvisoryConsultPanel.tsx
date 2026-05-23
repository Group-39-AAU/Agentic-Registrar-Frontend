"use client";

import { useState } from "react";
import {
  ApiError,
  consultPreRegistration,
  type AdvisoryRecommendation,
} from "@/lib/api";

type Props = {
  termId: string;
};

function riskStyles(risk: string): { bg: string; text: string; label: string } {
  const upper = (risk || "").toUpperCase();
  if (upper === "LOW") {
    return { bg: "bg-[#dff1e4]", text: "text-[#1f7a3a]", label: "Low risk" };
  }
  if (upper === "MEDIUM") {
    return { bg: "bg-[#fff3d4]", text: "text-[#8a5a00]", label: "Medium risk" };
  }
  if (upper === "HIGH") {
    return { bg: "bg-[#fde0e0]", text: "text-[#a31a1a]", label: "High risk" };
  }
  return { bg: "bg-[#eef2f6]", text: "text-[#1f5b94]", label: risk || "—" };
}

export default function AdvisoryConsultPanel({ termId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<AdvisoryRecommendation | null>(null);

  async function runConsult() {
    if (!termId || loading) return;
    setError(null);
    setLoading(true);
    try {
      const data = await consultPreRegistration(termId);
      setRecommendation(data);
    } catch (err: unknown) {
      let message: string;
      if (err instanceof ApiError) {
        message =
          err.message && err.message !== "Request failed"
            ? `${err.status}: ${err.message}`
            : `Request failed with status ${err.status}`;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = "Could not reach the advisor.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const risk = recommendation ? riskStyles(recommendation.risk_status) : null;
  const impact = recommendation?.graduation_impact;

  return (
    <>
      {/* Floating trigger bubble */}
      <button
        type="button"
        aria-label={open ? "Close AI Advisor" : "Open AI Advisor"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[80] grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(180deg,#3a86c4_0%,#2f78b7_55%,#255f93_100%)] text-white shadow-[0_2px_6px_rgba(15,23,42,0.18),0_18px_36px_-12px_rgba(31,91,148,0.6)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_2px_6px_rgba(15,23,42,0.2),0_24px_44px_-14px_rgba(31,91,148,0.75)]"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <path d="M6 6l12 12M6 18L18 6" />
          ) : (
            <>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </>
          )}
        </svg>
      </button>

      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="AI Advisor"
        className={`fixed bottom-24 right-5 z-[79] w-[calc(100vw-2.5rem)] max-w-[420px] origin-bottom-right overflow-hidden rounded-2xl border border-[#dde6ef] bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_30px_60px_-22px_rgba(31,91,148,0.45)] transition-all duration-300 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-gray-100 bg-[linear-gradient(180deg,#f0f6fc_0%,#ffffff_100%)] px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2f76b7]">
              AI Advisor
            </p>
            <h3 className="mt-0.5 text-[16px] font-bold text-[#1f2f40]">
              Pre-registration consult
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#5a5a5a]">
              A suggestion to inform your choices — not a hard rule.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded text-[#5a5a5a] hover:bg-black/5"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {!recommendation && !loading && !error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#e8f0f8] text-[#2f76b7]">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a7 7 0 0 0-4 12.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3A7 7 0 0 0 12 2z" />
                  <path d="M10 22h4" />
                </svg>
              </div>
              <p className="text-[13px] leading-relaxed text-[#3a3a3a]">
                Ask the AI advisor to review your situation and suggest a course load before you pick.
              </p>
              <button
                type="button"
                onClick={runConsult}
                className="mt-2 rounded-md bg-[linear-gradient(180deg,#3a86c4_0%,#2f78b7_100%)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_18px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#2f78b7_0%,#255f93_100%)] hover:shadow-[0_2px_0_rgba(255,255,255,0.2)_inset,0_14px_22px_-12px_rgba(31,91,148,0.85)]"
              >
                Consult the agent
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
              <p className="text-[13px] text-[#5a5a5a]">Asking the advisor…</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </div>
          ) : null}

          {recommendation && !loading ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {risk ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${risk.bg} ${risk.text}`}
                  >
                    {risk.label}
                  </span>
                ) : null}
                {recommendation.verdict ? (
                  <span className="inline-flex items-center rounded-full bg-[#eef2f6] px-2.5 py-0.5 text-[11px] font-semibold text-[#1f5b94]">
                    {recommendation.verdict}
                  </span>
                ) : null}
              </div>

              {recommendation.narrative ? (
                <p className="text-[13px] leading-relaxed text-[#1f1f1f]">
                  {recommendation.narrative}
                </p>
              ) : null}

              {recommendation.recommended_courses.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                    Recommended courses
                  </p>
                  <ul className="space-y-2">
                    {recommendation.recommended_courses.map((course) => (
                      <li
                        key={course.course_code}
                        className="rounded-md border border-[#e3e8ee] bg-[#fafbfc] px-3 py-2"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-[13px] font-semibold text-[#1f2f40]">
                            {course.course_code} · {course.title}
                          </p>
                          <span className="text-[11px] text-[#5a5a5a]">
                            {course.credit_hours} cr
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {course.is_core ? (
                            <span className="inline-flex items-center rounded-full bg-[#e8f0f8] px-2 py-0.5 text-[10px] font-semibold text-[#1f5b94]">
                              Core
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#f1f3f5] px-2 py-0.5 text-[10px] font-semibold text-[#5a5a5a]">
                              Elective
                            </span>
                          )}
                          {course.requires_override ? (
                            <span className="inline-flex items-center rounded-full bg-[#fff3d4] px-2 py-0.5 text-[10px] font-semibold text-[#8a5a00]">
                              Needs override
                            </span>
                          ) : null}
                        </div>
                        {course.reason ? (
                          <p className="mt-1.5 text-[12px] leading-relaxed text-[#3a3a3a]">
                            {course.reason}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {recommendation.warnings.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                    Warnings
                  </p>
                  <ul className="space-y-1.5">
                    {recommendation.warnings.map((warning, idx) => (
                      <li
                        key={`${warning}-${idx}`}
                        className="flex gap-2 rounded-md border border-[#f5d8b3] bg-[#fff7e8] px-3 py-2 text-[12px] leading-relaxed text-[#8a5a00]"
                      >
                        <span aria-hidden="true">⚠</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {impact ? (
                <div className="rounded-md border border-[#dde6ef] bg-[#f7f9fc] px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                    Graduation impact
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-y-1 text-[12px] text-[#1f2f40]">
                    <span className="font-semibold">On track</span>
                    <span className="text-right">
                      {impact.on_track ? "Yes" : "No"}
                    </span>
                    <span className="font-semibold">Semesters remaining</span>
                    <span className="text-right">{impact.semesters_remaining}</span>
                    <span className="font-semibold">Expected semester</span>
                    <span className="text-right">{impact.expected_graduation_semester}</span>
                    {impact.delay_semesters > 0 ? (
                      <>
                        <span className="font-semibold text-[#a31a1a]">Delay</span>
                        <span className="text-right text-[#a31a1a]">
                          +{impact.delay_semesters} sem
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {recommendation || error ? (
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-[#fafbfc] px-5 py-3">
            <p className="text-[11px] italic text-[#5a5a5a]">
              Suggestion only — your decision stands.
            </p>
            <button
              type="button"
              onClick={runConsult}
              disabled={loading}
              className="rounded-md border border-[#c6d3de] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1f5b94] transition-colors hover:bg-[#eef4fa] disabled:opacity-60"
            >
              Request again
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
