"use client";

import { Section } from "@/components/ApiHelpers";
import Pagination from "@/components/Pagination";
import { usePageTitle } from "@/components/usePageTitle";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ProgramChoice = {
  code?: string;
  name?: string;
};

type FlaggedApplication = {
  id: string;
  applicant_email?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  sponsorship_type?: string;
  stream?: string;
  admission_number?: string;
  program_choice_1?: ProgramChoice | null;
  program_choice_2?: ProgramChoice | null;
  program_choice_3?: ProgramChoice | null;
  current_status?: string;
  payment_status?: string;
  created_at?: string;
  updated_at?: string;
};

type FlagContext = {
  application_id: string;
  current_status?: string;
  latest_ai_recommendation?: string;
  latest_ai_confidence?: number;
  latest_ai_summary?: string;
  traces?: Array<Record<string, unknown>>;
};

type TraceItem = {
  step_name?: string;
  reasoning_log?: string;
};

type RequestState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

const initialState = <T,>(): RequestState<T> => ({
  loading: false,
  error: null,
  data: null,
});

// ── Action labels (human-readable, with descriptions) ────────────
type Action =
  | "APPROVE_AND_CONTINUE"
  | "REQUEST_STUDENT_CORRECTION"
  | "ESCALATE_TO_PENDING_REVIEW"
  | "REJECT_NOW";

const ACTION_META: Record<
  Action,
  { label: string; hint: string; tone: "ok" | "warn" | "info" | "danger" }
> = {
  APPROVE_AND_CONTINUE: {
    label: "Approve & continue to UAT",
    hint: "Clear the flag and advance the application to the UAT step.",
    tone: "ok",
  },
  REQUEST_STUDENT_CORRECTION: {
    label: "Request student correction",
    hint: "Send the application back to the applicant to fix their name / admission number.",
    tone: "warn",
  },
  ESCALATE_TO_PENDING_REVIEW: {
    label: "Escalate to senior review",
    hint: "Skip the standard pipeline and push directly to the senior decision queue.",
    tone: "info",
  },
  REJECT_NOW: {
    label: "Reject application",
    hint: "Terminal rejection. Applicant is notified.",
    tone: "danger",
  },
};

// ── Status / AI pill styling ─────────────────────────────────────
function statusClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "FLAGGED_FOR_REVIEW")
    return "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]";
  if (s === "CHANGES_REQUESTED")
    return "border-[#cdbdf0] bg-[#f3edfb] text-[#5f3aa0]";
  if (s === "PENDING_REVIEW")
    return "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]";
  if (s.includes("UAT")) return "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]";
  if (s === "REJECTED" || s === "DECIDED")
    return "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]";
  return "border-gray-200 bg-gray-50 text-gray-600";
}

function aiClass(rec: string): string {
  const r = rec.toUpperCase();
  if (r.startsWith("RECOMMEND")) return "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]";
  if (r.includes("FLAG")) return "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]";
  if (r.includes("REJECT")) return "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]";
  return "border-gray-200 bg-gray-50 text-gray-600";
}

function StatusPill({ value, kind }: { value: string; kind: "status" | "ai" }) {
  const cls = kind === "status" ? statusClass(value) : aiClass(value);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] ${cls}`}
    >
      {value.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

// ── API helpers ──────────────────────────────────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  return headers;
}

async function requestApi(path: string, method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail?: unknown }).detail ?? "Request failed")
        : "Request failed";
    throw new Error(`${detail} (HTTP ${res.status})`);
  }
  return payload;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function applicantName(row: FlaggedApplication): string {
  return `${row.applicant_first_name ?? ""} ${row.applicant_last_name ?? ""}`.trim() || "—";
}

function initials(row: FlaggedApplication): string {
  const f = (row.applicant_first_name ?? "").trim();
  const l = (row.applicant_last_name ?? "").trim();
  return ((f.slice(0, 1) || "?") + (l.slice(0, 1) || "")).toUpperCase();
}

// ── Page ─────────────────────────────────────────────────────────
export default function FlagsPage() {
  usePageTitle("Flagged Review");
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id") ?? "";
  const [queue, setQueue] = useState<RequestState<FlaggedApplication[]>>(initialState);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(requestedId);
  const [contextState, setContextState] = useState<RequestState<FlagContext>>(initialState);
  const [resolveState, setResolveState] = useState<RequestState<FlaggedApplication>>(initialState);
  const [action, setAction] = useState<Action>("APPROVE_AND_CONTINUE");
  const [resolutionNote, setResolutionNote] = useState("");
  // Backend returns plain ``list[…]`` — no total. We track ``hasMore``
  // by checking whether the current page returned a full window.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const selectedApplication = useMemo(
    () => (queue.data ?? []).find((row) => row.id === selectedApplicationId) ?? null,
    [queue.data, selectedApplicationId],
  );

  const loadQueue = useCallback(
    async (targetPage: number, targetPageSize: number) => {
      setQueue({ loading: true, error: null, data: null });
      try {
        const offset = (targetPage - 1) * targetPageSize;
        const params = new URLSearchParams({
          limit: String(targetPageSize),
          offset: String(offset),
        });
        const payload = await requestApi(
          `/api/v1/undergraduate/applications/flagged-queue?${params.toString()}`,
          "GET",
        );
        const rows = Array.isArray(payload) ? (payload as FlaggedApplication[]) : [];
        setQueue({ loading: false, error: null, data: rows });
        setSelectedApplicationId((prev) => {
          if (!rows.length) return "";
          // Honor an explicit ?id=… first if it's in the queue.
          if (requestedId && rows.some((row) => row.id === requestedId)) {
            return requestedId;
          }
          if (prev && rows.some((row) => row.id === prev)) return prev;
          return rows[0].id;
        });
      } catch (error) {
        setQueue({
          loading: false,
          error: error instanceof Error ? error.message : "Could not load flagged queue.",
          data: null,
        });
        setSelectedApplicationId("");
      }
    },
    [requestedId],
  );

  const loadFlagContext = async (applicationId: string) => {
    if (!applicationId) return;
    setContextState({ loading: true, error: null, data: null });
    try {
      const payload = (await requestApi(
        `/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/flag-context`,
        "GET",
      )) as FlagContext;
      setContextState({ loading: false, error: null, data: payload });
    } catch (error) {
      setContextState({
        loading: false,
        error: error instanceof Error ? error.message : "Could not load flag context.",
        data: null,
      });
    }
  };

  const resolveFlag = async () => {
    if (!selectedApplicationId) {
      setResolveState({ loading: false, error: "Select an application from the flagged queue.", data: null });
      return;
    }
    if (!resolutionNote.trim()) {
      setResolveState({ loading: false, error: "Resolution note is required.", data: null });
      return;
    }

    setResolveState({ loading: true, error: null, data: null });
    try {
      const payload = (await requestApi(
        `/api/v1/undergraduate/applications/${encodeURIComponent(selectedApplicationId)}/resolve-flag`,
        "POST",
        {
          action,
          resolution_note: resolutionNote.trim(),
        },
      )) as FlaggedApplication;
      setResolveState({ loading: false, error: null, data: payload });
      setResolutionNote("");
      await loadQueue(page, pageSize);
    } catch (error) {
      setResolveState({
        loading: false,
        error: error instanceof Error ? error.message : "Could not resolve flag.",
        data: null,
      });
    }
  };

  useEffect(() => {
    void loadQueue(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    if (!selectedApplicationId) return;
    void loadFlagContext(selectedApplicationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedApplicationId]);

  const queueRows = queue.data ?? [];
  const flaggedCount = queueRows.length;
  const ctx = contextState.data;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2f76b7]">
          Admission · Flagged Review
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
          Flagged Applications
        </h1>
        <p className="mt-2 max-w-[760px] text-[13px] text-[#5a5a5a]">
          Applications the credential-verification agent flagged for human review. Pick one to
          inspect the AI&apos;s reasoning, then approve, request a correction, escalate, or reject.
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Queue */}
        <Section
          title="Flagged Queue"
          subtitle="Click an applicant to load their flag detail on the right."
          action={
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#f0d9a0] bg-[#fff7e2] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a5a00]">
                {flaggedCount} flagged
              </span>
              <button
                type="button"
                onClick={() => void loadQueue(page, pageSize)}
                disabled={queue.loading}
                className="h-[34px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
              >
                {queue.loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          }
        >
          {queue.loading ? (
            <p className="text-[13px] text-[#5a5a5a]">Loading flagged applications…</p>
          ) : queue.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {queue.error}
            </p>
          ) : queueRows.length === 0 ? (
            <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-8 text-center text-[13px] text-[#5a5a5a]">
              No flagged applications — the queue is clear.
            </p>
          ) : (
            <ul className="space-y-2">
              {queueRows.map((row) => {
                const selected = row.id === selectedApplicationId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedApplicationId(row.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-[#2f76b7] bg-[#eaf3ff] shadow-[0_1px_2px_rgba(31,91,148,0.18)]"
                          : "border-gray-200 bg-white hover:border-[#9bb0cc] hover:bg-[#f6faff]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2f76b7] text-[12px] font-bold uppercase text-white">
                          {initials(row)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="truncate text-[13.5px] font-semibold text-[#1f2f40]">
                              {applicantName(row)}
                            </p>
                            {row.current_status ? (
                              <StatusPill value={row.current_status} kind="status" />
                            ) : null}
                          </div>
                          <p className="truncate text-[11.5px] text-[#5a5a5a]">
                            {row.applicant_email ?? "—"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#3a3a3a]">
                            <span>
                              Adm <span className="font-mono font-semibold">{row.admission_number ?? "—"}</span>
                            </span>
                            {row.stream ? <span>· {row.stream}</span> : null}
                            {row.sponsorship_type ? <span>· {row.sponsorship_type}</span> : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {queue.data && (queueRows.length > 0 || page > 1) ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
              <Pagination
                page={page}
                pageSize={pageSize}
                hasMore={queueRows.length === pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                itemLabel="flagged applications"
              />
            </div>
          ) : null}
        </Section>

        {/* Detail + Resolve */}
        <Section
          title="Flag Detail & Resolution"
          subtitle="Read the AI reasoning, then decide on an action below."
        >
          {!selectedApplication ? (
            <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-10 text-center text-[13px] text-[#5a5a5a]">
              Select a flagged application from the queue.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Applicant summary card */}
              <div className="rounded-xl border border-gray-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fa_100%)] p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2f76b7] text-[14px] font-bold uppercase text-white">
                    {initials(selectedApplication)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold text-[#1f2f40]">
                      {applicantName(selectedApplication)}
                    </h3>
                    <p className="text-[12px] text-[#5a5a5a]">{selectedApplication.applicant_email ?? "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#3a3a3a]">
                      <span>
                        Admission <span className="font-mono font-semibold">{selectedApplication.admission_number ?? "—"}</span>
                      </span>
                      <span>Stream: <b>{selectedApplication.stream ?? "—"}</b></span>
                      <span>Sponsorship: <b>{selectedApplication.sponsorship_type ?? "—"}</b></span>
                    </div>
                  </div>
                </div>

                {/* Program preferences */}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[1, 2, 3].map((n) => {
                    const key = `program_choice_${n}` as const;
                    const choice =
                      (selectedApplication as unknown as Record<string, ProgramChoice | null>)[key] ?? null;
                    return (
                      <div
                        key={key}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2 text-[11.5px]"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                          Choice {n}
                        </p>
                        {choice?.code || choice?.name ? (
                          <>
                            <p className="font-mono text-[12px] font-semibold text-[#1f5b94]">
                              {choice.code ?? "—"}
                            </p>
                            <p className="truncate text-[#3a3a3a]" title={choice.name ?? ""}>
                              {choice.name ?? "—"}
                            </p>
                          </>
                        ) : (
                          <p className="text-[#8a8a8a]">—</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI verdict */}
              {contextState.loading ? (
                <p className="text-[13px] text-[#5a5a5a]">Loading AI verdict…</p>
              ) : contextState.error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {contextState.error}
                </p>
              ) : ctx ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                      AI Verdict
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ctx.current_status ? <StatusPill value={ctx.current_status} kind="status" /> : null}
                      {ctx.latest_ai_recommendation ? (
                        <StatusPill value={ctx.latest_ai_recommendation} kind="ai" />
                      ) : null}
                    </div>
                  </div>

                  {typeof ctx.latest_ai_confidence === "number" ? (
                    <div className="mb-3">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-[#5a5a5a]">
                        <span>Confidence</span>
                        <span className="font-semibold text-[#1f2f40]">
                          {Math.round((ctx.latest_ai_confidence ?? 0) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#2f76b7]"
                          style={{ width: `${Math.max(0, Math.min(1, ctx.latest_ai_confidence)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {ctx.latest_ai_summary ? (
                    <p className="rounded-md border border-gray-100 bg-[#f8fafc] px-3 py-2 text-[12.5px] leading-relaxed text-[#1f2f40]">
                      {ctx.latest_ai_summary}
                    </p>
                  ) : null}

                  {/* Traces */}
                  {(ctx.traces ?? []).length > 0 ? (
                    <details className="mt-3 group">
                      <summary className="cursor-pointer select-none text-[12px] font-semibold text-[#2f76b7] hover:underline">
                        Reasoning traces ({(ctx.traces ?? []).length})
                      </summary>
                      <div className="mt-2 max-h-[300px] space-y-2 overflow-auto rounded-md border border-gray-100 bg-[#f8fafc] p-2">
                        {(ctx.traces as TraceItem[]).map((trace, i) => (
                          <div
                            key={`${trace.step_name ?? "step"}-${i}`}
                            className="rounded-md border border-[#d9e4f2] bg-white px-3 py-2"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2f76b7]">
                              {trace.step_name ?? `Step ${i + 1}`}
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-[#1f2937]">
                              {trace.reasoning_log ?? "No reasoning log."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  ) : null}
                </div>
              ) : null}

              {/* Resolve panel */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  Resolve flag
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(ACTION_META) as Action[]).map((a) => {
                    const meta = ACTION_META[a];
                    const active = a === action;
                    const accent =
                      meta.tone === "ok"
                        ? "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]"
                        : meta.tone === "warn"
                          ? "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]"
                          : meta.tone === "info"
                            ? "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]"
                            : "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]";
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAction(a)}
                        className={`rounded-lg border px-3 py-2 text-left transition-all ${
                          active
                            ? `${accent} shadow-[0_1px_2px_rgba(15,23,42,0.08)]`
                            : "border-gray-200 bg-white hover:border-[#9bb0cc] hover:bg-[#f6faff]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`grid h-4 w-4 place-items-center rounded-full border ${
                              active ? "border-current bg-current" : "border-gray-300"
                            }`}
                          >
                            {active ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                          </div>
                          <p className="text-[12.5px] font-semibold">{meta.label}</p>
                        </div>
                        <p
                          className={`mt-1 pl-6 text-[11px] ${active ? "" : "text-[#5a5a5a]"}`}
                        >
                          {meta.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  Resolution note <span className="text-[#a31a1a]">*</span>
                </label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="What did you verify? What should the applicant know? This is logged for audit."
                  rows={3}
                  required
                  className="mt-1 w-full resize-y rounded-md border border-[#9bb0cc] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#2f76b7]"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[#8a8a8a]">
                    Resolution is irreversible — choose carefully.
                  </p>
                  <button
                    type="button"
                    onClick={() => void resolveFlag()}
                    disabled={resolveState.loading}
                    className="h-[36px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
                  >
                    {resolveState.loading ? "Resolving…" : `Resolve · ${ACTION_META[action].label}`}
                  </button>
                </div>

                {resolveState.error ? (
                  <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                    {resolveState.error}
                  </p>
                ) : null}
                {resolveState.data ? (
                  <p className="mt-3 rounded-md border border-[#cae6cf] bg-[#ecf8ef] px-3 py-2 text-[12px] text-[#1f7a3a]">
                    Flag resolved. Application updated to{" "}
                    <span className="font-semibold">
                      {(resolveState.data.current_status ?? "").replace(/_/g, " ").toLowerCase()}
                    </span>
                    .{" "}
                    {selectedApplication?.updated_at
                      ? `Last updated ${formatDateTime(selectedApplication.updated_at)}.`
                      : ""}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
