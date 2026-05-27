"use client";

import { useEffect, useMemo, useState } from "react";
import {
  consultAddDrop,
  type AdvisoryRecommendation,
} from "@/lib/api";

export type AdvisoryCandidate = {
  id: string;
  code: string;
  title: string;
  credit_hours: number;
};

type Props = {
  addCandidates: AdvisoryCandidate[];
  dropCandidates: AdvisoryCandidate[];
  initialAddIds?: string[];
  initialDropIds?: string[];
};

type Mode = "proactive" | "guided";

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

function PickerSection({
  title,
  tone,
  candidates,
  selected,
  onToggle,
  onToggleAll,
}: {
  title: string;
  tone: "add" | "drop";
  candidates: AdvisoryCandidate[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const palette =
    tone === "add"
      ? {
          chip: "bg-[#dff1e4] text-[#1f7a3a]",
          checked: "border-[#2f9648] bg-[#2f9648]",
          rowSel: "bg-[#eef9f1]",
        }
      : {
          chip: "bg-[#fde0e0] text-[#a31a1a]",
          checked: "border-[#c0392b] bg-[#c0392b]",
          rowSel: "bg-[#fdeded]",
        };

  const allSelected = candidates.length > 0 && selected.length === candidates.length;

  return (
    <div className="rounded-md border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${palette.chip}`}>
            {title}
          </span>
          <span className="text-[11px] text-[#5a5a5a]">{candidates.length}</span>
        </div>
        {candidates.length > 0 ? (
          <button
            type="button"
            onClick={onToggleAll}
            className="text-[11px] font-semibold text-[#1f5b94] hover:underline"
          >
            {allSelected ? "Clear" : "Select all"}
          </button>
        ) : null}
      </div>
      {candidates.length === 0 ? (
        <p className="px-3 py-3 text-center text-[11.5px] italic text-[#5a5a5a]">
          Nothing here.
        </p>
      ) : (
        <ul className="max-h-[170px] divide-y divide-gray-100 overflow-y-auto">
          {candidates.map((c) => {
            const isSel = selected.includes(c.id);
            return (
              <li key={c.id}>
                <label
                  className={`flex cursor-pointer items-start gap-2 px-3 py-2 transition-colors ${
                    isSel ? palette.rowSel : "hover:bg-[#f6f9fc]"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded border transition-colors ${
                      isSel ? palette.checked + " text-white" : "border-[#9bb0cc] bg-white"
                    }`}
                  >
                    {isSel ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </span>
                  <input type="checkbox" className="sr-only" checked={isSel} onChange={() => onToggle(c.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-[#1f2f40]">
                      <span className="font-mono text-[#1f5b94]">{c.code}</span>
                      {" · "}
                      {c.title}
                    </p>
                    <p className="text-[10.5px] text-[#5a5a5a]">{c.credit_hours} cr</p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AdvisoryAddDropPanel({
  addCandidates,
  dropCandidates,
  initialAddIds = [],
  initialDropIds = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(
    initialAddIds.length + initialDropIds.length > 0 ? "guided" : "proactive",
  );
  const [addIds, setAddIds] = useState<string[]>(initialAddIds);
  const [dropIds, setDropIds] = useState<string[]>(initialDropIds);

  // Keep selection in sync with parent when it changes externally and the
  // user hasn't diverged the panel state (e.g. first open).
  const initialKey = useMemo(
    () => [...initialAddIds].sort().join("|") + "::" + [...initialDropIds].sort().join("|"),
    [initialAddIds, initialDropIds],
  );
  useEffect(() => {
    setAddIds(initialAddIds);
    setDropIds(initialDropIds);
    if (initialAddIds.length + initialDropIds.length > 0) setMode("guided");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<AdvisoryRecommendation | null>(null);

  const totalSelection = addIds.length + dropIds.length;
  const guidedReady = totalSelection > 0;

  async function runConsult(forcedMode?: Mode) {
    if (loading) return;
    const useMode = forcedMode ?? mode;
    setError(null);
    setLoading(true);
    try {
      const body =
        useMode === "guided"
          ? { add_course_ids: addIds, drop_course_ids: dropIds }
          : {};
      const data = await consultAddDrop(body);
      setRecommendation(data);
    } catch {
      setError("Agent is unavailable, try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleAdd(id: string) {
    setAddIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function toggleDrop(id: string) {
    setDropIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function toggleAllAdd() {
    setAddIds((prev) =>
      prev.length === addCandidates.length ? [] : addCandidates.map((c) => c.id),
    );
  }
  function toggleAllDrop() {
    setDropIds((prev) =>
      prev.length === dropCandidates.length ? [] : dropCandidates.map((c) => c.id),
    );
  }

  const risk = recommendation ? riskStyles(recommendation.risk_status) : null;
  const impact = recommendation?.graduation_impact;

  return (
    <>
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
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          )}
        </svg>
        {totalSelection > 0 && !open ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-white bg-[#e04b4b] px-1 text-[10px] font-bold text-white shadow"
          >
            {totalSelection}
          </span>
        ) : null}
      </button>

      <div
        role="dialog"
        aria-modal="false"
        aria-label="AI Advisor — Add/Drop"
        className={`fixed bottom-24 right-5 z-[79] w-[calc(100vw-2.5rem)] max-w-[440px] origin-bottom-right overflow-hidden rounded-2xl border border-[#dde6ef] bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08),0_30px_60px_-22px_rgba(31,91,148,0.45)] transition-all duration-300 ease-out ${
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
              Add / drop consult
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-[#5a5a5a]">
              Pick a mode below — ask the advisor for suggestions, or have it evaluate a specific plan.
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

        {/* Mode tabs */}
        <div className="border-b border-gray-100 px-5 pt-3">
          <div className="inline-flex w-full rounded-lg bg-[#eef2f6] p-1 text-[12px] font-semibold">
            <button
              type="button"
              onClick={() => setMode("proactive")}
              className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                mode === "proactive"
                  ? "bg-white text-[#1f5b94] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-[#5a5a5a] hover:text-[#1f2f40]"
              }`}
            >
              Proactive
            </button>
            <button
              type="button"
              onClick={() => setMode("guided")}
              className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                mode === "guided"
                  ? "bg-white text-[#1f5b94] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-[#5a5a5a] hover:text-[#1f2f40]"
              }`}
            >
              Guided{totalSelection > 0 ? ` · ${totalSelection}` : ""}
            </button>
          </div>
          <p className="mt-2 pb-3 text-[11.5px] leading-relaxed text-[#5a5a5a]">
            {mode === "proactive"
              ? "I'll review your active registration and suggest concrete adds or drops if useful — no input needed."
              : "Pick the courses you're thinking about adding or dropping, and I'll evaluate that specific plan."}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {mode === "guided" && !recommendation && !loading ? (
            <div className="space-y-3">
              <PickerSection
                title="Add"
                tone="add"
                candidates={addCandidates}
                selected={addIds}
                onToggle={toggleAdd}
                onToggleAll={toggleAllAdd}
              />
              <PickerSection
                title="Drop"
                tone="drop"
                candidates={dropCandidates}
                selected={dropIds}
                onToggle={toggleDrop}
                onToggleAll={toggleAllDrop}
              />
            </div>
          ) : null}

          {mode === "proactive" && !recommendation && !loading && !error ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
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
              <p className="text-[12.5px] leading-relaxed text-[#3a3a3a]">
                Hit the button below and the advisor will look at your registration against the curriculum and history.
              </p>
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
                <span className="ml-auto inline-flex items-center rounded-full bg-[#f1f3f5] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  {mode}
                </span>
              </div>

              {recommendation.narrative ? (
                <p className="text-[13px] leading-relaxed text-[#1f1f1f]">
                  {recommendation.narrative}
                </p>
              ) : null}

              {recommendation.recommended_courses.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                    Suggested courses
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
                    <span className="text-right">{impact.on_track ? "Yes" : "No"}</span>
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

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-[#fafbfc] px-5 py-3">
          <p className="text-[11px] italic text-[#5a5a5a]">
            Suggestion only — your decision stands.
          </p>
          {recommendation ? (
            <button
              type="button"
              onClick={() => setRecommendation(null)}
              className="rounded-md border border-[#c6d3de] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1f5b94] transition-colors hover:bg-[#eef4fa]"
            >
              New consult
            </button>
          ) : (
            <button
              type="button"
              onClick={() => runConsult()}
              disabled={loading || (mode === "guided" && !guidedReady)}
              className="rounded-md bg-[linear-gradient(180deg,#3a86c4_0%,#2f78b7_100%)] px-4 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_18px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 enabled:hover:-translate-y-[1px] enabled:hover:bg-[linear-gradient(180deg,#2f78b7_0%,#255f93_100%)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {loading
                ? "Asking…"
                : mode === "proactive"
                  ? "Ask the agent"
                  : guidedReady
                    ? `Check this plan (${totalSelection})`
                    : "Pick at least one course"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
