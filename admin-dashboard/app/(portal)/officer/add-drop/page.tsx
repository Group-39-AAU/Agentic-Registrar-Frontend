"use client";

import { Section } from "@/components/ApiHelpers";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AddDropBatchStatus =
  | "PENDING_AGENT"
  | "AGENT_APPROVED"
  | "AGENT_DENIED"
  | "APPLIED"
  | "REJECTED"
  | "CANCELLED";

type AddDropAction = "ADD" | "DROP";

type AgentReason = {
  course_id?: string;
  course_code?: string;
  action?: AddDropAction;
  passed?: boolean;
  reasons?: string[];
};

type BatchItem = {
  id: string;
  course_id: string;
  action: AddDropAction;
  status?: string;
  reason?: string | null;
  course_code?: string | null;
  course_title?: string | null;
  course_credit_hours?: number | null;
};

type Batch = {
  id: string;
  registration_id: string;
  student_id: string;
  status: AddDropBatchStatus;
  agent_reasons?: AgentReason[];
  officer_id?: string | null;
  officer_decision_at?: string | null;
  officer_justification?: string | null;
  items: BatchItem[];
  student_name?: string | null;
  student_number?: string | null;
  term_name?: string | null;
};

type StatusFilter = "ALL" | "AGENT_APPROVED" | "AGENT_DENIED";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All pending (default)" },
  { value: "AGENT_APPROVED", label: "Agent approved" },
  { value: "AGENT_DENIED", label: "Agent denied" },
];

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

function shortId(id: string): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function StatusPill({ status }: { status: AddDropBatchStatus }) {
  const map: Record<AddDropBatchStatus, string> = {
    PENDING_AGENT: "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]",
    AGENT_APPROVED: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]",
    AGENT_DENIED: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]",
    APPLIED: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]",
    REJECTED: "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]",
    CANCELLED: "border-gray-300 bg-gray-50 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${map[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function ActionTag({ action }: { action: AddDropAction }) {
  const isAdd = action === "ADD";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
        isAdd ? "bg-[#ecf8ef] text-[#1f7a3a]" : "bg-[#fdebeb] text-[#a31a1a]"
      }`}
    >
      {action}
    </span>
  );
}

export default function OfficerAddDropQueuePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/v1/courses/officer/add-drop/batches`);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      const res = await fetch(url.toString(), { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Request failed")
            : "Could not load the add/drop queue.";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      const rows = Array.isArray(data) ? (data as Batch[]) : [];
      setBatches(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the add/drop queue.");
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const counts = useMemo(() => {
    let approved = 0;
    let denied = 0;
    batches.forEach((b) => {
      if (b.status === "AGENT_APPROVED") approved += 1;
      else if (b.status === "AGENT_DENIED") denied += 1;
    });
    return { approved, denied, total: batches.length };
  }, [batches]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,120,183,0.15)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(224,75,75,0.08)_0%,transparent_70%)]" />
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f76b7]">
            Course Officer · Add / Drop
          </p>
          <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
            Officer decision queue
          </h1>
          <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-[#5a5a5a]">
            Student add/drop batches the EnrollmentAdjustmentAgent has already
            reviewed. Approve agent-approved batches to apply them, override
            agent-denied batches when you disagree, or finalise a denial — both
            override and reject require a justification.
          </p>
        </div>
      </div>

      <Section
        title="Pending batches"
        subtitle="Defaults to every batch awaiting an officer decision (AGENT_APPROVED + AGENT_DENIED), oldest first."
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="status-filter"
              className="text-[12px] font-semibold text-[#3a3a3a]"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-[36px] min-w-[220px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] text-[#1a1a1a] outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-[#cae6cf] bg-[#ecf8ef] px-3 py-1.5 text-[12px] text-[#1f7a3a]">
              <span className="font-bold tabular-nums">{counts.approved}</span> agent-approved
            </div>
            <div className="rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-3 py-1.5 text-[12px] text-[#8a5a00]">
              <span className="font-bold tabular-nums">{counts.denied}</span> agent-denied
            </div>
            <button
              type="button"
              onClick={() => void loadQueue()}
              disabled={loading}
              className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        ) : loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading queue…</p>
        ) : batches.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No batches match this filter — the queue is clear.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[920px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Courses</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const reasons = b.agent_reasons ?? [];
                  const passed = reasons.filter((r) => r.passed).length;
                  const failed = reasons.filter((r) => !r.passed).length;
                  const courses = b.items.map((it) => {
                    const reasonRow = reasons.find((r) => r.course_id === it.course_id);
                    return {
                      action: it.action,
                      code:
                        it.course_code ??
                        reasonRow?.course_code ??
                        shortId(it.course_id),
                      title: it.course_title ?? "",
                    };
                  });
                  return (
                    <tr
                      key={b.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/officer/add-drop/${b.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/officer/add-drop/${b.id}`);
                        }
                      }}
                      className="cursor-pointer border-b border-gray-100 hover:bg-[#eef4ff]/70"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#1f2f40]">
                          {b.student_name ?? "Unknown student"}
                        </div>
                        {b.student_number ? (
                          <div className="mt-0.5 font-mono text-[11px] text-[#5a5a5a]">
                            {b.student_number}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-[#3a3a3a]">
                        {b.term_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={b.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        <span className="font-semibold text-[#1f2f40]">
                          {b.items.length}
                        </span>
                        <span className="ml-2 text-[11px] text-[#5a5a5a]">
                          {passed} pass · {failed} fail
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {courses.slice(0, 4).map((c, i) => (
                            <span
                              key={`${b.id}-${i}`}
                              title={c.title || undefined}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-[#3a3a3a]"
                            >
                              <ActionTag action={c.action} />
                              <span className="font-mono">{c.code}</span>
                            </span>
                          ))}
                          {courses.length > 4 ? (
                            <span className="text-[11px] text-[#5a5a5a]">
                              +{courses.length - 4} more
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/officer/add-drop/${b.id}`);
                          }}
                          className="h-[30px] rounded-md bg-[#3f79b5] px-3 text-[11px] font-semibold text-white hover:bg-[#356e9f]"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
