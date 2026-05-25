"use client";

import { RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CourseTerm = {
  id: string;
  term_name: string;
  phase: string;
  start_date?: string;
  end_date?: string;
  is_open?: boolean;
};

type AllocationResponse = {
  term_id?: string;
  department?: string;
  sections_created?: unknown[];
  students_placed_count?: number;
  students_placed?: unknown[];
  failed?: unknown[];
};

type ScheduleResponse = {
  term_id?: string;
  department?: string;
  section_count?: number;
  slots_created?: number;
  sections?: unknown[];
  conflict_count?: number;
  conflict_ids?: string[];
};

type DepartmentTermOverview = {
  term_id: string;
  department: string;
  sections: unknown[];
  students_placed_count: number;
  slots_count: number;
  has_sections: boolean;
  has_slots: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** "ONE" → "One", "two" → "Two", etc. */
function formatPhase(phase: string): string {
  if (!phase) return phase;
  return phase.charAt(0).toUpperCase() + phase.slice(1).toLowerCase();
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

function StepBadge({ index, active, done }: { index: number; active: boolean; done: boolean }) {
  return (
    <div
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-[12px] font-bold transition-colors ${
        done
          ? "border-[#2f78b7] bg-[#2f78b7] text-white shadow-[0_8px_16px_-8px_rgba(31,91,148,0.6)]"
          : active
            ? "border-[#2f78b7] bg-white text-[#2f78b7]"
            : "border-gray-300 bg-white text-gray-400"
      }`}
    >
      {done ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        index
      )}
    </div>
  );
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

function getSectionId(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  return (
    pickString(item as Record<string, unknown>, [
      "id",
      "section_id",
      "sectionId",
      "uuid",
    ]) ?? ""
  );
}

function getSectionName(item: unknown): string {
  if (!item || typeof item !== "object") return "—";
  return (
    pickString(item as Record<string, unknown>, [
      "name",
      "section_name",
      "sectionName",
      "section_code",
      "sectionCode",
      "code",
      "label",
    ]) ?? "—"
  );
}

function getSectionSemester(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  return pickString(item as Record<string, unknown>, [
    "semester",
    "year",
    "level",
  ]);
}

/**
 * Maps an academic semester number to a year label.
 * 1–2 → Year 1, 3–4 → Year 2, … 9–10 → Year 5.
 */
function semesterToYearLabel(semester: string | null): string {
  if (!semester) return "Year —";
  const n = Number(semester);
  if (!Number.isFinite(n) || n < 1) return "Year —";
  const year = Math.ceil(n / 2);
  const semInYear = ((n - 1) % 2) + 1;
  return `Year ${year} · Sem ${semInYear}`;
}

function SectionGrid({
  sections,
  contextQuery,
  emptyLabel,
  target,
}: {
  sections: unknown[];
  contextQuery: string;
  emptyLabel: string;
  target: "students" | "schedule";
}) {
  if (sections.length === 0) {
    return (
      <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-4 text-center text-[12px] text-[#5a5a5a]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a5a5a]">
        Sections ({sections.length})
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((s, idx) => {
          const id = getSectionId(s) || `idx-${idx}`;
          const name = getSectionName(s);
          const semester = getSectionSemester(s);
          const isLinkable = !!getSectionId(s);
          const href = isLinkable
            ? `/officer/sections/${encodeURIComponent(id)}/${target}${contextQuery}`
            : null;

          const card = (
            <div className="aau-card group flex h-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition-transform">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-[#1f2f40] group-hover:text-[#1f5b94]">
                  {name}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[#5a5a5a]">
                  {semesterToYearLabel(semester)}
                </p>
              </div>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef4fa] text-[#2f76b7] transition-colors group-hover:bg-[#2f76b7] group-hover:text-white ${
                  isLinkable ? "" : "opacity-40"
                }`}
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          );

          return (
            <li key={id}>
              {href ? (
                <Link href={href} className="block no-underline">
                  {card}
                </Link>
              ) : (
                <div title="Section id missing — cannot open details">{card}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
}) {
  const toneStyles = {
    neutral: "border-gray-200 bg-white text-[#1a1a1a]",
    brand: "border-[#cfddec] bg-[linear-gradient(180deg,#eef4fa_0%,#e3edf7_100%)] text-[#1f5b94]",
    success: "border-[#cae6cf] bg-[linear-gradient(180deg,#ecf8ef_0%,#dff1e4_100%)] text-[#1f7a3a]",
    warning: "border-[#f0d9a0] bg-[linear-gradient(180deg,#fff7e2_0%,#fce9b9_100%)] text-[#8a5a00]",
    danger: "border-[#f0bcbc] bg-[linear-gradient(180deg,#fdebeb_0%,#f8d3d3_100%)] text-[#a31a1a]",
  } as const;

  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${toneStyles[tone]}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-70">
        {label}
      </span>
      <span className="text-[26px] font-bold tabular-nums leading-none">{value}</span>
    </div>
  );
}

export default function OfficerPage() {
  const [terms, setTerms] = useState<CourseTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState("");
  const [phase, setPhase] = useState("");

  const [allocation, setAllocation] = useState<RequestState>(initialState);
  const [schedule, setSchedule] = useState<RequestState>(initialState);

  const [overview, setOverview] = useState<DepartmentTermOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    setTermsError(null);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/courses/terms`, {
          headers: authHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("Could not load course terms.");
        const rows = Array.isArray(data) ? (data as CourseTerm[]) : [];
        if (!cancelled) {
          setTerms(rows);
          // Default to the currently-open term so the DH lands on
          // the active academic year + semester without picking.
          const open = rows.find((t) => t.is_open) ?? null;
          if (open) {
            setAcademicYear(open.term_name);
            setPhase(open.phase);
          }
        }
      } catch (err) {
        if (!cancelled)
          setTermsError(err instanceof Error ? err.message : "Could not load course terms.");
      } finally {
        if (!cancelled) setTermsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const termsByYear = useMemo(() => {
    const m = new Map<string, CourseTerm[]>();
    terms.forEach((t) => {
      const list = m.get(t.term_name) ?? [];
      list.push(t);
      m.set(t.term_name, list);
    });
    return m;
  }, [terms]);

  const yearOptions = useMemo(() => Array.from(termsByYear.keys()), [termsByYear]);
  const phaseOptions = useMemo(() => {
    if (!academicYear) return [] as CourseTerm[];
    return termsByYear.get(academicYear) ?? [];
  }, [academicYear, termsByYear]);

  const selectedTerm = useMemo(() => {
    if (!academicYear || !phase) return null;
    return (termsByYear.get(academicYear) ?? []).find((t) => t.phase === phase) ?? null;
  }, [academicYear, phase, termsByYear]);

  const step1Done = !!selectedTerm;
  const readyToRun = step1Done;

  async function fetchOverview(termId: string): Promise<DepartmentTermOverview | null> {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/officer/sections/overview?term_id=${encodeURIComponent(termId)}`,
        { headers: authHeaders() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "")
            : "";
        throw new Error(detail || "Could not load department overview.");
      }
      const ov = data as DepartmentTermOverview;
      setOverview(ov);
      return ov;
    } catch (err) {
      setOverview(null);
      setOverviewError(
        err instanceof Error ? err.message : "Could not load department overview.",
      );
      return null;
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedTerm) {
      setOverview(null);
      setOverviewError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const ov = await fetchOverview(selectedTerm.id);
      if (cancelled) return;
      void ov;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTerm?.id]);

  function handleAcademicYearChange(v: string) {
    setAcademicYear(v);
    setPhase("");
    setAllocation(initialState);
    setSchedule(initialState);
  }

  function handlePhaseChange(v: string) {
    setPhase(v);
    setAllocation(initialState);
    setSchedule(initialState);
  }

  async function runAllocation() {
    if (!selectedTerm) return;
    await callApi(setAllocation, "/api/v1/courses/officer/sections/allocate", "POST", {
      term_id: selectedTerm.id,
    });
    await fetchOverview(selectedTerm.id);
  }

  async function runSchedule() {
    if (!selectedTerm) return;
    await callApi(setSchedule, "/api/v1/courses/officer/schedule/generate", "POST", {
      term_id: selectedTerm.id,
    });
    await fetchOverview(selectedTerm.id);
  }

  const allocationData = allocation.data as AllocationResponse | null;
  const scheduleData = schedule.data as ScheduleResponse | null;

  const allocateDisabledByExisting = !!overview?.has_sections;
  const generateDisabledByExisting = !!overview?.has_slots;
  const generateBlockedNoSections = !!overview && !overview.has_sections;

  const contextQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedTerm?.id) params.set("term_id", selectedTerm.id);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [selectedTerm]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,120,183,0.15)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(224,75,75,0.08)_0%,transparent_70%)]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f76b7]">
            Course Officer
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
            Sections & schedule operations
          </h1>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#5a5a5a]">
            Pick the academic term, then run section allocation or schedule
            generation for your department. Each run is independent — results
            appear below the action.
          </p>
        </div>
      </div>

      {/* Setup card */}
      <Section title="Setup" subtitle="Choose the term these operations will run against — your department is used automatically.">
        <div className="rounded-xl border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] p-5">
          <div className="mb-4 flex items-center gap-3">
            <StepBadge index={1} active={!step1Done} done={step1Done} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a5a5a]">
                Step 1
              </p>
              <p className="text-[14px] font-semibold text-[#1f2f40]">Academic term</p>
            </div>
          </div>

          {termsError ? (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {termsError}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#3a3a3a]">
                Academic year
              </label>
              <select
                value={academicYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                disabled={termsLoading || yearOptions.length === 0}
                className="h-[40px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none disabled:opacity-60"
              >
                <option value="">
                  {termsLoading
                    ? "Loading terms…"
                    : yearOptions.length === 0
                      ? "No terms available"
                      : "Select academic year"}
                </option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#3a3a3a]">
                Calendar semester
              </label>
              <select
                value={phase}
                onChange={(e) => handlePhaseChange(e.target.value)}
                disabled={!academicYear || phaseOptions.length === 0}
                className="h-[40px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none disabled:opacity-60"
              >
                <option value="">
                  {!academicYear
                    ? "Pick an academic year first"
                    : phaseOptions.length === 0
                      ? "No semesters for this year"
                      : "Select calendar semester"}
                </option>
                {phaseOptions.map((p) => (
                  <option key={p.id} value={p.phase}>
                    {formatPhase(p.phase)}
                    {p.is_open ? " · open" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTerm ? (
            <div className="mt-4 rounded-md border border-[#cfddec] bg-[#eef4fa] px-3 py-2 text-[12px] text-[#1f5b94]">
              <span className="font-semibold">Resolved term:</span>{" "}
              {selectedTerm.term_name} · {formatPhase(selectedTerm.phase)}
            </div>
          ) : null}
        </div>
      </Section>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Allocate sections */}
        <section className="aau-card flex flex-col rounded-2xl p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(180deg,#eaf2fb_0%,#d4e3f3_100%)] text-[#2f76b7]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7h18M3 12h18M3 17h12" />
              </svg>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#1f2f40]">Section allocation</h3>
              <p className="mt-0.5 text-[12.5px] text-[#5a5a5a]">
                Places students from your department into sections for the chosen term.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!readyToRun || allocation.loading || allocateDisabledByExisting}
            onClick={runAllocation}
            className="aau-button-primary mb-4 inline-flex h-[42px] items-center justify-center rounded-md px-5 text-[13px] font-semibold tracking-wide text-white"
          >
            {allocation.loading ? "Allocating sections…" : "Allocate sections"}
          </button>

          {allocation.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {allocation.error}
            </p>
          ) : null}

          {overviewLoading && !overview ? (
            <p className="text-[12px] italic text-[#5a5a5a]">Loading sections…</p>
          ) : overview && overview.has_sections ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Sections"
                  value={overview.sections.length}
                  tone="brand"
                />
                <MetricCard
                  label="Students placed"
                  value={overview.students_placed_count}
                  tone="success"
                />
                {allocationData && (allocationData.failed ?? []).length > 0 ? (
                  <MetricCard
                    label="Failed (last run)"
                    value={(allocationData.failed ?? []).length}
                    tone="danger"
                  />
                ) : null}
              </div>
              {overview.department ? (
                <p className="text-[12px] text-[#5a5a5a]">
                  Department:{" "}
                  <span className="font-semibold text-[#1f2f40]">{overview.department}</span>
                </p>
              ) : null}
              {allocationData && (allocationData.failed ?? []).length > 0 ? (
                <details className="rounded-md border border-[#f0bcbc] bg-[#fdebeb] px-3 py-2 text-[12px] text-[#7a1818]">
                  <summary className="cursor-pointer font-semibold">
                    View failed entries from the last run
                  </summary>
                  <pre className="mt-2 max-h-[200px] overflow-auto rounded bg-white/60 p-2 text-[11px] text-[#3a3a3a]">
                    {JSON.stringify(allocationData.failed, null, 2)}
                  </pre>
                </details>
              ) : null}

              <SectionGrid
                sections={overview.sections}
                contextQuery={contextQuery}
                emptyLabel="No sections have been allocated yet for this term."
                target="students"
              />
            </div>
          ) : !allocation.loading && !allocation.error ? (
            <p className="text-[12px] italic text-[#5a5a5a]">
              {readyToRun
                ? "No sections allocated yet — click the button to run allocation."
                : "Pick a term to enable this action."}
            </p>
          ) : null}
        </section>

        {/* Generate schedule */}
        <section className="aau-card flex flex-col rounded-2xl p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(180deg,#fdeaea_0%,#f8d4d4_100%)] text-[#c0392b]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#1f2f40]">Schedule generation</h3>
              <p className="mt-0.5 text-[12.5px] text-[#5a5a5a]">
                Builds the timetable slots for sections in your department for the chosen term.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              !readyToRun
              || schedule.loading
              || generateDisabledByExisting
              || generateBlockedNoSections
            }
            onClick={runSchedule}
            className="aau-button-primary mb-4 inline-flex h-[42px] items-center justify-center rounded-md px-5 text-[13px] font-semibold tracking-wide text-white"
          >
            {schedule.loading ? "Generating schedule…" : "Generate schedule"}
          </button>

          {generateBlockedNoSections && !generateDisabledByExisting ? (
            <p className="mb-3 rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-3 py-2 text-[12px] text-[#8a5a00]">
              Allocate sections first — there's nothing to schedule yet.
            </p>
          ) : null}

          {schedule.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {schedule.error}
            </p>
          ) : null}

          {overviewLoading && !overview ? (
            <p className="text-[12px] italic text-[#5a5a5a]">Loading schedule…</p>
          ) : overview && overview.has_slots ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Sections"
                  value={overview.sections.length}
                  tone="brand"
                />
                <MetricCard
                  label="Slots"
                  value={overview.slots_count}
                  tone="success"
                />
                {scheduleData
                  && (scheduleData.conflict_count ?? (scheduleData.conflict_ids ?? []).length) > 0 ? (
                  <MetricCard
                    label="Conflicts (last run)"
                    value={scheduleData.conflict_count ?? (scheduleData.conflict_ids ?? []).length}
                    tone="warning"
                  />
                ) : null}
              </div>
              {overview.department ? (
                <p className="text-[12px] text-[#5a5a5a]">
                  Department:{" "}
                  <span className="font-semibold text-[#1f2f40]">{overview.department}</span>
                </p>
              ) : null}
              {scheduleData && scheduleData.conflict_ids && scheduleData.conflict_ids.length > 0 ? (
                <details className="rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-3 py-2 text-[12px] text-[#8a5a00]">
                  <summary className="cursor-pointer font-semibold">
                    Conflict IDs from the last run ({scheduleData.conflict_ids.length})
                  </summary>
                  <ul className="mt-2 max-h-[200px] space-y-1 overflow-auto">
                    {scheduleData.conflict_ids.map((cid) => (
                      <li key={cid} className="font-mono text-[11px] text-[#5a3a00]">
                        {cid}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <SectionGrid
                sections={overview.sections}
                contextQuery={contextQuery}
                emptyLabel="No schedule has been generated yet for this term."
                target="schedule"
              />
            </div>
          ) : !schedule.loading && !schedule.error ? (
            <p className="text-[12px] italic text-[#5a5a5a]">
              {!readyToRun
                ? "Pick a term to enable this action."
                : generateBlockedNoSections
                  ? "Allocate sections first — there's nothing to schedule yet."
                  : "No schedule generated yet — click the button to build it."}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
