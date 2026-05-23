"use client";

import { Section } from "@/components/ApiHelpers";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type GradeSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "FLAGGED"
  | "REJECTED"
  | "AUTHORISED";

type AgentVerdict = "APPROVE" | "FLAG" | "PENDING";

type QueueEntry = {
  batch_id: string;
  section_id: string;
  section_code: string;
  section_department: string;
  section_semester: number;
  course_id: string;
  course_code: string;
  course_title: string;
  term_id: string;
  term_name: string;
  instructor_id: string;
  instructor_name: string;
  status: GradeSubmissionStatus;
  iteration_count: number;
  submitted_at: string | null;
  latest_agent_verdict: AgentVerdict | null;
  flag_count: number;
  has_instructor_justification: boolean;
  roster_total: number;
};

type CourseTerm = {
  id: string;
  term_name: string;
  phase: string;
  is_open?: boolean;
};

type StatusFilter = "ALL" | "SUBMITTED" | "FLAGGED";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

function formatPhase(phase: string): string {
  if (!phase) return phase;
  return phase.charAt(0).toUpperCase() + phase.slice(1).toLowerCase();
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function StatusPill({ status }: { status: GradeSubmissionStatus }) {
  const map: Record<GradeSubmissionStatus, string> = {
    DRAFT: "border-gray-300 bg-gray-50 text-gray-600",
    SUBMITTED: "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]",
    FLAGGED: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]",
    REJECTED: "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]",
    AUTHORISED: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${map[status]}`}
    >
      {status}
    </span>
  );
}

function VerdictPill({ verdict }: { verdict: AgentVerdict | null }) {
  if (verdict == null) {
    return (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-gray-500">
        no run
      </span>
    );
  }
  const map: Record<AgentVerdict, string> = {
    APPROVE: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]",
    FLAG: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]",
    PENDING: "border-gray-300 bg-gray-50 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${map[verdict]}`}
    >
      {verdict}
    </span>
  );
}

export default function OfficerGradingQueuePage() {
  const router = useRouter();
  const [terms, setTerms] = useState<CourseTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termId, setTermId] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/courses/terms`, {
          headers: authHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("Could not load terms.");
        const rows = Array.isArray(data) ? (data as CourseTerm[]) : [];
        if (!cancelled) setTerms(rows);
      } catch {
        // Term filter is optional — surface only on the queue load itself.
      } finally {
        if (!cancelled) setTermsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(
        `${API_BASE}/api/v1/courses/grading/officer/queue`,
      );
      if (termId) url.searchParams.set("term_id", termId);
      if (departmentFilter.trim())
        url.searchParams.set("department", departmentFilter.trim());
      const res = await fetch(url.toString(), { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Request failed")
            : "Could not load the queue.";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      const rows = Array.isArray(data) ? (data as QueueEntry[]) : [];
      setEntries(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the queue.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [termId, departmentFilter]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return entries;
    return entries.filter((e) => e.status === statusFilter);
  }, [entries, statusFilter]);

  const counts = useMemo(() => {
    let submitted = 0;
    let flagged = 0;
    let pendingAgent = 0;
    entries.forEach((e) => {
      if (e.status === "SUBMITTED") submitted += 1;
      else if (e.status === "FLAGGED") flagged += 1;
      if (e.latest_agent_verdict === "PENDING") pendingAgent += 1;
    });
    return { submitted, flagged, pendingAgent, total: entries.length };
  }, [entries]);

  async function rerunAgent(batchId: string) {
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/grading/officer/batches/${encodeURIComponent(batchId)}/rerun-agent`,
        { method: "POST", headers: authHeaders() },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Rerun failed")
            : "Rerun failed";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      await loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rerun failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,120,183,0.15)_0%,transparent_70%)]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f76b7]">
            Department Head · Grade Authorisation
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
            Grading review queue
          </h1>
          <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-[#5a5a5a]">
            Batches the GradingMonitorAgent has finished reviewing. Open one to
            see the full packet, then authorise or reject. Re-run the agent on
            any row whose latest verdict is PENDING.
          </p>
        </div>
      </div>

      <Section
        title="Pending batches"
        subtitle="Defaults to every batch awaiting a department-head decision (SUBMITTED + FLAGGED), oldest first."
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="term-filter"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]"
            >
              Term
            </label>
            <select
              id="term-filter"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              disabled={termsLoading}
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none"
            >
              <option value="">All terms</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.term_name} · {formatPhase(t.phase)}
                  {t.is_open ? " · open" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="dept-filter"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]"
            >
              Department
            </label>
            <input
              id="dept-filter"
              type="text"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              placeholder="e.g. Computer Science"
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="status-filter"
              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] outline-none"
            >
              <option value="ALL">All (submitted + flagged)</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void loadQueue()}
              disabled={loading}
              className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
          <span className="rounded-md border border-[#cfddec] bg-[#eef4fa] px-3 py-1 text-[#1f5b94]">
            <span className="font-bold tabular-nums">{counts.submitted}</span> submitted
          </span>
          <span className="rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-3 py-1 text-[#8a5a00]">
            <span className="font-bold tabular-nums">{counts.flagged}</span> flagged
          </span>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1 text-gray-600">
            <span className="font-bold tabular-nums">{counts.pendingAgent}</span> agent pending
          </span>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        ) : loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading queue…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No batches match these filters — the queue is clear.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[1080px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">Course / Section</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3 text-right">Roster</th>
                  <th className="px-4 py-3 text-right">Iter</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr
                    key={e.batch_id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/officer/grading/${e.batch_id}`)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        router.push(`/officer/grading/${e.batch_id}`);
                      }
                    }}
                    className="cursor-pointer border-b border-gray-100 hover:bg-[#eef4ff]/70"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12.5px] font-semibold text-[#1f5b94]">
                        {e.course_code}
                      </div>
                      <div className="mt-0.5 text-[12.5px] text-[#1f2f40]">
                        {e.course_title}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#5a5a5a]">
                        Section {e.section_code} · Sem {e.section_semester}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[#1f2f40]">
                      {e.instructor_name}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[#3a3a3a]">
                      {e.term_name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={e.status} />
                      {e.has_instructor_justification ? (
                        <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#8a5a00]">
                          + justification
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <VerdictPill verdict={e.latest_agent_verdict} />
                      {e.flag_count > 0 ? (
                        <div className="mt-1 text-[11px] font-semibold text-[#a31a1a]">
                          {e.flag_count} flag{e.flag_count === 1 ? "" : "s"}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {e.roster_total}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {e.iteration_count}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                      {formatDateTime(e.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex flex-col items-end gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/officer/grading/${e.batch_id}`)
                          }
                          className="h-[30px] rounded-md bg-[#3f79b5] px-3 text-[11px] font-semibold text-white hover:bg-[#356e9f]"
                        >
                          Review
                        </button>
                        {e.latest_agent_verdict === "PENDING" ? (
                          <button
                            type="button"
                            onClick={() => void rerunAgent(e.batch_id)}
                            className="h-[26px] rounded-md border border-[#9bb0cc] bg-white px-2 text-[11px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff]"
                          >
                            Rerun agent
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
