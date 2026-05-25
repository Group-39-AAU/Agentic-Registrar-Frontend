"use client";

import { Section } from "@/components/ApiHelpers";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail?: unknown }).detail ?? "Request failed")
        : "Request failed";
    throw new Error(`${detail} (HTTP ${res.status})`);
  }
  return data as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? typeof (data as { detail?: unknown }).detail === "string"
          ? String((data as { detail?: unknown }).detail)
          : JSON.stringify((data as { detail?: unknown }).detail)
        : "Request failed";
    throw new Error(`${detail} (HTTP ${res.status})`);
  }
  return data as T;
}

// ── Types ────────────────────────────────────────────────────────
type AcademicStatusType = "PROMOTED" | "WARNING" | "DISTINCTION" | "DISMISSED" | "INCOMPLETE";

type StandingTerm = {
  id: string;
  term_name: string;
  phase: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  has_authorised_grades: boolean;
};
type DeptOption = { department: string; section_count: number; student_count: number };
type SectionOption = {
  id: string;
  section_code: string;
  semester: number;
  department: string;
  enrolled_count: number;
  capacity: number;
};
type ExistingStanding = {
  id: string;
  proposed_status: AcademicStatusType;
  final_status: AcademicStatusType | null;
  requires_review: boolean;
  sgpa: number | null;
  cgpa: number | null;
  computed_at: string;
  authorised_at: string | null;
};
type RosterGrade = {
  course_code: string;
  course_title: string;
  credit_hours: number;
  letter_grade: string;
  grade_points: number | null;
  is_dropped: boolean;
};
type RosterStudent = {
  student_id: string;
  student_number: string;
  full_name: string;
  current_semester: number;
  sgpa: number | null;
  cgpa: number | null;
  term_credit_hours: number;
  cumulative_credit_hours: number;
  f_count_term: number;
  has_incomplete_marks: boolean;
  grades_this_term: RosterGrade[];
  existing_standing: ExistingStanding | null;
};
type RosterResponse = {
  term_id: string;
  term_name: string;
  section_id: string;
  section_code: string;
  department: string;
  semester: number;
  students: RosterStudent[];
};
type ComputeResult = {
  term_id: string;
  computed_count: number;
  skipped_count: number;
  counts_by_status: Record<string, number>;
};
type QueueEntry = {
  id: string;
  student_id: string;
  student_number: string;
  full_name: string;
  term_id: string;
  term_name: string;
  department: string;
  sgpa: number | null;
  cgpa: number | null;
  proposed_status: AcademicStatusType;
  final_status: AcademicStatusType | null;
  requires_review: boolean;
  computed_at: string;
  authorised_at: string | null;
};

const STATUS_META: Record<AcademicStatusType, { label: string; cls: string }> = {
  PROMOTED: { label: "Promoted", cls: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]" },
  WARNING: { label: "Warning", cls: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]" },
  DISMISSED: { label: "Dismissed", cls: "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]" },
  INCOMPLETE: { label: "Incomplete", cls: "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]" },
  DISTINCTION: { label: "Distinction", cls: "border-[#cdbdf0] bg-[#f3edfb] text-[#5f3aa0]" },
};
const OVERRIDE_CHOICES: AcademicStatusType[] = ["PROMOTED", "WARNING", "DISMISSED", "INCOMPLETE"];

function StatusChip({ status }: { status: AcademicStatusType | null }) {
  if (!status) return <span className="text-[12px] text-[#8a8a8a]">—</span>;
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${m.cls}`}>
      {m.label}
    </span>
  );
}

function fmtPhase(p: string): string {
  return p ? p.charAt(0) + p.slice(1).toLowerCase() : p;
}
function fmtGpa(v: number | null | undefined): string {
  return v == null ? "—" : v.toFixed(2);
}

export default function StandingConsolePage() {
  // Drill-down state
  const [terms, setTerms] = useState<StandingTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [department, setDepartment] = useState("");
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [rosterLoading, setRosterLoading] = useState(false);

  const [computeBusy, setComputeBusy] = useState(false);
  const [computeResult, setComputeResult] = useState<ComputeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Queue state
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [onlyPending, setOnlyPending] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Override modal
  const [overrideFor, setOverrideFor] = useState<QueueEntry | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<AcademicStatusType>("WARNING");
  const [overrideReason, setOverrideReason] = useState("");
  const [reasonFor, setReasonFor] = useState<QueueEntry | null>(null); // held authorise
  const [reasonText, setReasonText] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ── Loaders ──
  useEffect(() => {
    apiGet<StandingTerm[]>("/api/v1/courses/standing/terms")
      .then(setTerms)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load terms."));
  }, []);

  useEffect(() => {
    setDepartment("");
    setSections([]);
    setSectionId("");
    setRoster(null);
    setDepartments([]);
    if (!termId) return;
    apiGet<DeptOption[]>(`/api/v1/courses/standing/terms/${termId}/departments`)
      .then(setDepartments)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load departments."));
  }, [termId]);

  useEffect(() => {
    setSectionId("");
    setRoster(null);
    setSections([]);
    if (!termId || !department) return;
    apiGet<SectionOption[]>(
      `/api/v1/courses/standing/terms/${termId}/departments/${encodeURIComponent(department)}/sections`,
    )
      .then(setSections)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load sections."));
  }, [termId, department]);

  const loadRoster = useCallback(async () => {
    if (!termId || !sectionId) return;
    setRosterLoading(true);
    setError(null);
    try {
      const r = await apiGet<RosterResponse>(
        `/api/v1/courses/standing/terms/${termId}/sections/${sectionId}/students`,
      );
      setRoster(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load roster.");
      setRoster(null);
    } finally {
      setRosterLoading(false);
    }
  }, [termId, sectionId]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const loadQueue = useCallback(async () => {
    if (!termId) {
      setQueue([]);
      return;
    }
    setQueueLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("term_id", termId);
      if (department) params.set("department", department);
      params.set("only_pending", String(onlyPending));
      const q = await apiGet<QueueEntry[]>(`/api/v1/courses/standing/officer/queue?${params}`);
      setQueue(q);
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load queue.");
      setQueue([]);
    } finally {
      setQueueLoading(false);
    }
  }, [termId, department, onlyPending]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  // ── Actions ──
  const computeScope = sectionId ? "section" : department ? "department" : "term";
  async function runCompute() {
    if (!termId) return;
    setComputeBusy(true);
    setError(null);
    setComputeResult(null);
    try {
      const body: Record<string, string> = {};
      if (sectionId) body.section_id = sectionId;
      else if (department) body.department = department;
      const r = await apiPost<ComputeResult>(
        `/api/v1/courses/standing/terms/${termId}/compute`,
        body,
      );
      setComputeResult(r);
      await Promise.all([loadRoster(), loadQueue()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compute failed.");
    } finally {
      setComputeBusy(false);
    }
  }

  async function authoriseOne(entry: QueueEntry) {
    if (entry.requires_review) {
      setReasonFor(entry);
      setReasonText("");
      setModalError(null);
      return;
    }
    setActionMsg(null);
    try {
      await apiPost(`/api/v1/courses/standing/${entry.id}/authorise`, {});
      setActionMsg(`Authorised ${entry.student_number} (${entry.proposed_status}).`);
      await loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorise failed.");
    }
  }

  async function submitHeldAuthorise() {
    if (!reasonFor) return;
    if (reasonText.trim().length < 3) {
      setModalError("A reason of at least 3 characters is required for held rows.");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      await apiPost(`/api/v1/courses/standing/${reasonFor.id}/authorise`, {
        reason: reasonText.trim(),
      });
      setActionMsg(`Authorised held row for ${reasonFor.student_number}.`);
      setReasonFor(null);
      await loadQueue();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Authorise failed.");
    } finally {
      setModalBusy(false);
    }
  }

  async function submitOverride() {
    if (!overrideFor) return;
    if (overrideReason.trim().length < 10) {
      setModalError("Override reason must be at least 10 characters.");
      return;
    }
    setModalBusy(true);
    setModalError(null);
    try {
      await apiPost(`/api/v1/courses/standing/${overrideFor.id}/override`, {
        new_status: overrideStatus,
        reason: overrideReason.trim(),
      });
      setActionMsg(`Overrode ${overrideFor.student_number} → ${overrideStatus}.`);
      setOverrideFor(null);
      await loadQueue();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Override failed.");
    } finally {
      setModalBusy(false);
    }
  }

  async function batchAuthorise() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setActionMsg(null);
    setError(null);
    try {
      const r = await apiPost<{
        authorised_count: number;
        already_authorised_count: number;
        held_needs_reason_count: number;
        not_found_count: number;
      }>("/api/v1/courses/standing/batch-authorise", { standing_ids: ids });
      const attention = r.held_needs_reason_count + r.not_found_count;
      setActionMsg(
        `${r.authorised_count} authorised, ${r.already_authorised_count} already done` +
          (attention > 0
            ? `, ${r.held_needs_reason_count} need a reason, ${r.not_found_count} not found.`
            : "."),
      );
      await loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch authorise failed.");
    }
  }

  function toggleSel(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const pendingIds = useMemo(
    () => queue.filter((q) => q.final_status == null).map((q) => q.id),
    [queue],
  );
  function toggleSelAll() {
    setSelected((prev) =>
      prev.size === pendingIds.length ? new Set() : new Set(pendingIds),
    );
  }

  return (
    <div className="space-y-6">
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
          Academic Standing
        </h1>
        <p className="mt-2 max-w-[760px] text-[13px] text-[#5a5a5a]">
          Drill into a term → department → section, compute Article-91 standings, then
          authorise, override, or batch-authorise the proposals.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : null}

      {/* Drill-down + roster */}
      <Section
        title="Browse & compute"
        subtitle="Pick a term with authorised grades, then narrow to a department / section."
        action={
          <button
            type="button"
            onClick={() => void runCompute()}
            disabled={!termId || computeBusy}
            className="h-[36px] rounded-md bg-[#2f76b7] px-4 text-[12px] font-semibold text-white hover:bg-[#27689f] disabled:cursor-not-allowed disabled:bg-[#b9c6d4]"
          >
            {computeBusy ? "Computing…" : `Compute (${computeScope})`}
          </button>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
              Term
            </label>
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none"
            >
              <option value="">Select term</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id} disabled={!t.has_authorised_grades}>
                  {t.term_name} · {fmtPhase(t.phase)}
                  {t.has_authorised_grades ? "" : " · no grades"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={!termId || departments.length === 0}
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none disabled:opacity-60"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.department} value={d.department}>
                  {d.department} ({d.student_count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
              Section
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!department || sections.length === 0}
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none disabled:opacity-60"
            >
              <option value="">Select section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.section_code} · Sem {s.semester} ({s.enrolled_count}/{s.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {computeResult ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-[#cfddec] bg-[#f3f8fc] px-3 py-2 text-[12px]">
            <span className="font-semibold text-[#1f5b94]">
              Computed {computeResult.computed_count}
            </span>
            {computeResult.skipped_count > 0 ? (
              <span className="text-[#5a5a5a]">· skipped {computeResult.skipped_count}</span>
            ) : null}
            {Object.entries(computeResult.counts_by_status).map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1">
                <StatusChip status={k as AcademicStatusType} />
                <span className="font-bold tabular-nums">{v}</span>
              </span>
            ))}
          </div>
        ) : null}

        {!sectionId ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            Select a section to preview its roster with live SGPA / CGPA.
          </p>
        ) : rosterLoading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading roster…</p>
        ) : roster && roster.students.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[820px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3 text-right">SGPA</th>
                  <th className="px-4 py-3 text-right">CGPA</th>
                  <th className="px-4 py-3 text-right">Term cr</th>
                  <th className="px-4 py-3 text-right">F</th>
                  <th className="px-4 py-3">Proposed</th>
                  <th className="px-4 py-3">Grades</th>
                </tr>
              </thead>
              <tbody>
                {roster.students.map((s) => {
                  const open = expanded.has(s.student_id);
                  return (
                    <Fragment key={s.student_id}>
                      <tr className="border-b border-gray-100 align-top">
                        <td className="px-4 py-3">
                          <div className="text-[12.5px] font-semibold text-[#1f2f40]">
                            {s.full_name}
                          </div>
                          <div className="font-mono text-[11.5px] text-[#5a5a5a]">
                            {s.student_number}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtGpa(s.sgpa)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{fmtGpa(s.cgpa)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{s.term_credit_hours}</td>
                        <td className={`px-4 py-3 text-right tabular-nums ${s.f_count_term > 0 ? "font-semibold text-[#a31a1a]" : ""}`}>
                          {s.f_count_term}
                        </td>
                        <td className="px-4 py-3">
                          {s.existing_standing ? (
                            <StatusChip status={s.existing_standing.proposed_status} />
                          ) : (
                            <span className="text-[11px] italic text-[#8a8a8a]">not computed</span>
                          )}
                          {s.has_incomplete_marks ? (
                            <div className="mt-1 text-[10.5px] font-semibold uppercase text-[#1f5b94]">
                              I/NG mark
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpanded((p) => {
                                const n = new Set(p);
                                if (n.has(s.student_id)) n.delete(s.student_id);
                                else n.add(s.student_id);
                                return n;
                              })
                            }
                            className="text-[12px] font-semibold text-[#2f76b7] hover:underline"
                          >
                            {open ? "Hide" : `${s.grades_this_term.length} courses`}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-b border-gray-100 bg-[#fbfdff]">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {s.grades_this_term.map((g, i) => (
                                <span
                                  key={`${s.student_id}-g-${i}`}
                                  className={`rounded-md border px-2 py-1 text-[11.5px] ${g.is_dropped ? "border-gray-200 bg-gray-50 text-gray-400 line-through" : "border-[#dde6ef] bg-white text-[#3a3a3a]"}`}
                                >
                                  <span className="font-mono font-semibold">{g.course_code}</span>{" "}
                                  {g.letter_grade}{" "}
                                  <span className="text-[#8a8a8a]">({g.credit_hours}cr)</span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No students in this section.
          </p>
        )}
      </Section>

      {/* Decision queue */}
      <Section
        title="Decision queue"
        subtitle="Computed standings awaiting your decision (filtered by the term/department above)."
        action={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[12px] text-[#5a5a5a]">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => setOnlyPending(e.target.checked)}
              />
              Only pending
            </label>
            <button
              type="button"
              onClick={() => void batchAuthorise()}
              disabled={selected.size === 0}
              className="h-[36px] rounded-md bg-[#2f9648] px-4 text-[12px] font-semibold text-white hover:bg-[#28823e] disabled:cursor-not-allowed disabled:bg-[#b6cdbb]"
            >
              Authorise selected ({selected.size})
            </button>
          </div>
        }
      >
        {actionMsg ? (
          <p className="mb-3 rounded-md border border-[#cae6cf] bg-[#ecf8ef] px-3 py-2 text-[12px] text-[#1f7a3a]">
            {actionMsg}
          </p>
        ) : null}

        {!termId ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            Pick a term above to load its decision queue.
          </p>
        ) : queueLoading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading queue…</p>
        ) : queue.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            Nothing awaiting a decision. Compute standings or clear the &quot;only pending&quot; filter.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={pendingIds.length > 0 && selected.size === pendingIds.length}
                      onChange={toggleSelAll}
                    />
                  </th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">SGPA</th>
                  <th className="px-4 py-3 text-right">CGPA</th>
                  <th className="px-4 py-3">Proposed</th>
                  <th className="px-4 py-3">Final</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => {
                  const decided = q.final_status != null;
                  return (
                    <tr key={q.id} className="border-b border-gray-100 align-top hover:bg-[#eef4ff]/50">
                      <td className="px-3 py-3">
                        {!decided ? (
                          <input
                            type="checkbox"
                            checked={selected.has(q.id)}
                            onChange={() => toggleSel(q.id)}
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12.5px] font-semibold text-[#1f2f40]">{q.full_name}</div>
                        <div className="font-mono text-[11.5px] text-[#5a5a5a]">{q.student_number}</div>
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-[#3a3a3a]">{q.department}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmtGpa(q.sgpa)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmtGpa(q.cgpa)}</td>
                      <td className="px-4 py-3">
                        <StatusChip status={q.proposed_status} />
                        {q.requires_review ? (
                          <div className="mt-1 text-[10.5px] font-semibold uppercase text-[#8a5a00]">
                            needs reason
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip status={q.final_status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {decided ? (
                          <span className="text-[11px] text-[#8a8a8a]">decided</span>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => void authoriseOne(q)}
                              className="h-[28px] rounded-md bg-[#2f9648] px-2.5 text-[11px] font-semibold text-white hover:bg-[#28823e]"
                            >
                              Authorise
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOverrideFor(q);
                                setOverrideStatus(q.proposed_status === "PROMOTED" ? "WARNING" : "PROMOTED");
                                setOverrideReason("");
                                setModalError(null);
                              }}
                              className="h-[28px] rounded-md border border-[#9bb0cc] bg-white px-2.5 text-[11px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff]"
                            >
                              Override
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Override modal */}
      {overrideFor ? (
        <Modal title={`Override — ${overrideFor.student_number}`} onClose={() => setOverrideFor(null)}>
          <p className="text-[12.5px] text-[#5a5a5a]">
            Agent proposed <b>{STATUS_META[overrideFor.proposed_status].label}</b>. Assign a
            different status with a documented reason.
          </p>
          <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
            New status
          </label>
          <select
            value={overrideStatus}
            onChange={(e) => setOverrideStatus(e.target.value as AcademicStatusType)}
            className="mt-1 h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none"
          >
            {OVERRIDE_CHOICES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
            Reason (10–4000 chars)
          </label>
          <textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            rows={4}
            placeholder="e.g. Medical emergency documented mid-term."
            className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-white px-3 py-2 text-[13px] outline-none"
          />
          {modalError ? (
            <p className="mt-2 text-[12px] text-[#a31a1a]">{modalError}</p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOverrideFor(null)}
              className="h-[34px] rounded-md border border-gray-300 bg-white px-4 text-[12px] font-semibold text-[#3a3a3a]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submitOverride()}
              disabled={modalBusy}
              className="h-[34px] rounded-md bg-[#2f76b7] px-4 text-[12px] font-semibold text-white hover:bg-[#27689f] disabled:opacity-60"
            >
              {modalBusy ? "Saving…" : "Override"}
            </button>
          </div>
        </Modal>
      ) : null}

      {/* Held-authorise reason modal */}
      {reasonFor ? (
        <Modal title={`Authorise (held) — ${reasonFor.student_number}`} onClose={() => setReasonFor(null)}>
          <p className="text-[12.5px] text-[#5a5a5a]">
            This row is held for review (I/NG mark). A reason is required to authorise the
            proposed <b>{STATUS_META[reasonFor.proposed_status].label}</b>.
          </p>
          <textarea
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            rows={4}
            placeholder="Reason for accepting this held proposal…"
            className="mt-3 w-full rounded-md border border-[#9bb0cc] bg-white px-3 py-2 text-[13px] outline-none"
          />
          {modalError ? <p className="mt-2 text-[12px] text-[#a31a1a]">{modalError}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReasonFor(null)}
              className="h-[34px] rounded-md border border-gray-300 bg-white px-4 text-[12px] font-semibold text-[#3a3a3a]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submitHeldAuthorise()}
              disabled={modalBusy}
              className="h-[34px] rounded-md bg-[#2f9648] px-4 text-[12px] font-semibold text-white hover:bg-[#28823e] disabled:opacity-60"
            >
              {modalBusy ? "Saving…" : "Authorise"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-[8px] border border-[#d9d9d9] bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e4] px-5 py-3">
          <h2 className="text-[15px] font-semibold text-[#1f1f1f]">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[22px] leading-none text-[#5a5a5a] hover:text-[#1f1f1f]"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
