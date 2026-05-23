"use client";

import { Section } from "@/components/ApiHelpers";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  details?: Record<string, unknown>;
};

type BatchItem = {
  id: string;
  batch_id?: string | null;
  registration_id: string;
  course_id: string;
  action: AddDropAction;
  deadline_snapshot?: string;
  status?: string;
  reason?: string | null;
  override_by_id?: string | null;
  override_justification?: string | null;
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
  officer_name?: string | null;
};

type DecisionMode = "approve" | "override" | "reject";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

function shortId(id?: string | null): string {
  if (!id) return "—";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${map[status]}`}
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

function VerdictBadge({ passed }: { passed: boolean }) {
  return passed ? (
    <span className="inline-flex items-center rounded-full border border-[#cae6cf] bg-[#ecf8ef] px-2 py-0.5 text-[11px] font-semibold text-[#1f7a3a]">
      PASS
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-[#f0bcbc] bg-[#fdebeb] px-2 py-0.5 text-[11px] font-semibold text-[#a31a1a]">
      FAIL
    </span>
  );
}

export default function OfficerAddDropBatchDetail() {
  const params = useParams<{ batchId: string }>();
  const batchId = params?.batchId ?? "";

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<DecisionMode | null>(null);
  const [justification, setJustification] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadBatch = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/add-drop/batches/${encodeURIComponent(batchId)}`,
        { headers: authHeaders() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Request failed")
            : "Could not load this batch.";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      setBatch(data as Batch);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this batch.");
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void loadBatch();
  }, [loadBatch]);

  const reasonsByCourse = useMemo(() => {
    const map = new Map<string, AgentReason>();
    (batch?.agent_reasons ?? []).forEach((r) => {
      // Skip the synthetic batch-level verdict (course_code "__BATCH__",
      // zero-UUID course_id) — it's surfaced separately below, not per row.
      if (r.course_id && r.course_code !== "__BATCH__") map.set(r.course_id, r);
    });
    return map;
  }, [batch?.agent_reasons]);

  // Batch-wide agent findings (e.g. credit-load envelope breaches) that
  // don't belong to any single course. Carried under course_code
  // "__BATCH__" in agent_reasons.
  const batchReasons = useMemo(() => {
    return (batch?.agent_reasons ?? [])
      .filter((r) => r.course_code === "__BATCH__")
      .flatMap((r) => r.reasons ?? []);
  }, [batch?.agent_reasons]);

  const isTerminal = batch
    ? batch.status === "APPLIED" || batch.status === "REJECTED" || batch.status === "CANCELLED"
    : false;
  const canApprove = batch?.status === "AGENT_APPROVED";
  const canOverride = batch?.status === "AGENT_DENIED";
  const canReject =
    batch?.status === "AGENT_APPROVED" || batch?.status === "AGENT_DENIED";

  function openDialog(next: DecisionMode) {
    setMode(next);
    setJustification("");
    setFormError(null);
  }

  function closeDialog() {
    if (submitting) return;
    setMode(null);
    setFormError(null);
  }

  async function submit() {
    if (!mode || !batch) return;
    const trimmed = justification.trim();
    if (mode !== "approve" && trimmed.length < 3) {
      setFormError("Justification must be at least 3 characters.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const path = `/api/v1/courses/officer/add-drop/batches/${encodeURIComponent(batch.id)}/${mode}`;
      const body: Record<string, unknown> | null =
        mode === "approve" ? null : { justification: trimmed };
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Request failed")
            : "Decision failed.";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      setBatch(data as Batch);
      setMode(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Decision failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/officer/add-drop"
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2f76b7] hover:underline"
        >
          ← Back to queue
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : loading || !batch ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading batch…</p>
      ) : (
        <>
          {/* Header card */}
          <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,120,183,0.15)_0%,transparent_70%)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f76b7]">
                  Add / Drop Batch
                </p>
                <h1 className="mt-1 text-[22px] font-bold tracking-[-0.01em] text-[#1f2f40]">
                  {batch.student_name ?? "Unknown student"}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[#5a5a5a]">
                  {batch.student_number ? (
                    <span>
                      Student #{" "}
                      <span className="font-mono text-[#1f2f40]">
                        {batch.student_number}
                      </span>
                    </span>
                  ) : null}
                  {batch.term_name ? (
                    <span>
                      Term{" "}
                      <span className="font-semibold text-[#1f2f40]">
                        {batch.term_name}
                      </span>
                    </span>
                  ) : null}
                  <span>
                    {batch.items.length} item{batch.items.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <StatusPill status={batch.status} />
            </div>

            {/* Decision actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDialog("approve")}
                disabled={!canApprove}
                title={
                  canApprove
                    ? "Apply this agent-approved batch."
                    : "Approve is only available when the agent approved the batch."
                }
                className="h-[38px] rounded-md bg-[#1f7a3a] px-4 text-[12.5px] font-semibold tracking-wide text-white hover:bg-[#1a6932] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve & apply
              </button>
              <button
                type="button"
                onClick={() => openDialog("override")}
                disabled={!canOverride}
                title={
                  canOverride
                    ? "Override the agent's denial and apply."
                    : "Override is only available when the agent denied the batch."
                }
                className="h-[38px] rounded-md bg-[#8a5a00] px-4 text-[12.5px] font-semibold tracking-wide text-white hover:bg-[#714900] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Override (apply anyway)
              </button>
              <button
                type="button"
                onClick={() => openDialog("reject")}
                disabled={!canReject}
                title={
                  canReject
                    ? "Finalise denial — no changes applied."
                    : "Reject is only available while the batch awaits an officer decision."
                }
                className="h-[38px] rounded-md bg-[#a31a1a] px-4 text-[12.5px] font-semibold tracking-wide text-white hover:bg-[#8a1414] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject (deny)
              </button>
              {isTerminal ? (
                <span className="self-center text-[12px] italic text-[#5a5a5a]">
                  This batch is finalised — no further officer action is available.
                </span>
              ) : null}
            </div>
          </div>

          {/* Batch-level agent reasoning (credit envelope, etc.) */}
          {batchReasons.length > 0 ? (
            <Section
              title="Agent assessment — batch level"
              subtitle="Findings the EnrollmentAdjustmentAgent raised against the batch as a whole, not any single course."
            >
              <ul className="list-disc space-y-1.5 rounded-lg border border-[#f0d9a0] bg-[#fff7e2] px-5 py-3 pl-8 text-[12.5px] text-[#8a5a00]">
                {batchReasons.map((line, i) => (
                  <li key={`batch-reason-${i}`}>{line}</li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* Items + per-item verdict */}
          <Section
            title="Batch items"
            subtitle="One row per (course, action). Reasons come from the EnrollmentAdjustmentAgent's per-item verdict."
          >
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[780px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3">Agent verdict</th>
                    <th className="px-4 py-3">Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.items.map((it) => {
                    const reason = reasonsByCourse.get(it.course_id);
                    const passed = reason?.passed ?? it.status === "APPROVED";
                    const reasonLines = reason?.reasons ?? (it.reason ? [it.reason] : []);
                    const code = it.course_code ?? reason?.course_code ?? "—";
                    const title = it.course_title ?? "";
                    return (
                      <tr key={it.id} className="border-b border-gray-100 align-top">
                        <td className="px-4 py-3">
                          <ActionTag action={it.action} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-[13px] font-semibold text-[#1f5b94]">
                            {code}
                          </div>
                          {title ? (
                            <div className="mt-0.5 text-[12.5px] text-[#1f2f40]">
                              {title}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-[12.5px] text-[#3a3a3a]">
                          {it.course_credit_hours ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <VerdictBadge passed={Boolean(passed)} />
                        </td>
                        <td className="px-4 py-3">
                          {reasonLines.length === 0 ? (
                            <span className="text-[12px] italic text-[#5a5a5a]">
                              No reasons provided.
                            </span>
                          ) : (
                            <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-[#3a3a3a]">
                              {reasonLines.map((line, i) => (
                                <li key={`${it.id}-${i}`}>{line}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Officer decision audit */}
          {batch.officer_name || batch.officer_decision_at || batch.officer_justification ? (
            <Section
              title="Officer decision"
              subtitle="Audit record once an officer has acted on this batch."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 bg-white p-3 text-[12.5px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
                    Officer
                  </p>
                  <p className="mt-1 text-[#1f2f40]">
                    {batch.officer_name ?? "—"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 bg-white p-3 text-[12.5px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
                    Decided at
                  </p>
                  <p className="mt-1 text-[#1f2f40]">
                    {formatDateTime(batch.officer_decision_at)}
                  </p>
                </div>
                {batch.officer_justification ? (
                  <div className="sm:col-span-2 rounded-md border border-gray-200 bg-white p-3 text-[12.5px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
                      Justification
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-[#1f2f40]">
                      {batch.officer_justification}
                    </p>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}
        </>
      )}

      {mode && batch ? (
        <DecisionDialog
          mode={mode}
          justification={justification}
          onJustificationChange={setJustification}
          onCancel={closeDialog}
          onConfirm={() => void submit()}
          submitting={submitting}
          error={formError}
        />
      ) : null}
    </div>
  );
}

function DecisionDialog({
  mode,
  justification,
  onJustificationChange,
  onCancel,
  onConfirm,
  submitting,
  error,
}: {
  mode: DecisionMode;
  justification: string;
  onJustificationChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const requiresJustification = mode !== "approve";
  const meta: Record<
    DecisionMode,
    { title: string; helper: string; confirm: string; tone: string }
  > = {
    approve: {
      title: "Approve & apply this batch",
      helper:
        "Every item will be materialised against the student's registration and the batch will transition to APPLIED.",
      confirm: "Apply batch",
      tone: "bg-[#1f7a3a] hover:bg-[#1a6932]",
    },
    override: {
      title: "Override the agent denial",
      helper:
        "Every item will be applied despite the agent's denial. Justification is required for the audit log.",
      confirm: "Override & apply",
      tone: "bg-[#8a5a00] hover:bg-[#714900]",
    },
    reject: {
      title: "Reject this batch",
      helper:
        "Finalises the denial — no changes will be applied to the registration. Justification is required.",
      confirm: "Reject batch",
      tone: "bg-[#a31a1a] hover:bg-[#8a1414]",
    },
  };
  const m = meta[mode];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-drop-decision-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
            Officer decision · {mode}
          </p>
          <h2 id="add-drop-decision-title" className="mt-1 text-[18px] font-bold text-[#1a1a1a]">
            {m.title}
          </h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">{m.helper}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {requiresJustification ? (
            <div>
              <label
                htmlFor="officer-justification"
                className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#3a3a3a]"
              >
                Justification
              </label>
              <textarea
                id="officer-justification"
                value={justification}
                onChange={(e) => onJustificationChange(e.target.value)}
                rows={5}
                placeholder="Explain the officer's reasoning for the audit log"
                className="w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 py-2 text-[13px] outline-none focus:border-[#3f79b5]"
              />
              <p className="mt-1 text-[11px] text-[#5a5a5a]">
                Required (3–4000 characters). Stored on the batch row.
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-[#cae6cf] bg-[#ecf8ef] px-3 py-2 text-[12.5px] text-[#1f5b94]">
              Approval applies the agent's verdict verbatim — no justification is required.
            </p>
          )}

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-[#fafbfc] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[13px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`h-[36px] min-w-[160px] rounded-md px-4 text-[13px] font-semibold text-white disabled:opacity-60 ${m.tone}`}
          >
            {submitting ? "Submitting…" : m.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
