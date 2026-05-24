"use client";

import { RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { useState } from "react";

type ReviewRow = {
  rank_position?: number;
  application_id?: string;
  id?: string;
  admission_number?: string;
  student_name?: string;
  sponsorship_type?: string;
  stream?: string;
  assigned_program_name?: string;
  /** Model suggestion (e.g. ADMIT / REJECT / WAITLIST) from review API. */
  ai_recommended_decision?: string;
  status?: string;
  current_status?: string;
  final_score?: number;
};

type SponsorshipFilter = "ALL" | "SELF_SPONSORED" | "GOVERNMENT";

/** Sent as optional `ai_recommended_decision` query param to the review students API. */
const AI_DECISION_QUERY_VALUES = [
  "RECOMMEND_ADMIT",
  "RECOMMEND_REJECT",
  "RECOMMEND_WAITLIST",

] as const;

type AiDecisionQueryFilter = "" | (typeof AI_DECISION_QUERY_VALUES)[number];

const AI_DECISION_FILTER_LABELS: Record<(typeof AI_DECISION_QUERY_VALUES)[number], string> = {
  RECOMMEND_ADMIT: "Recommend admit",
  RECOMMEND_REJECT: "Recommend reject",
  RECOMMEND_WAITLIST: "Recommend waitlist",
};

type HumanDecision = "ADMIT" | "REJECT" | "WAITLIST";

const DECISION_OPTIONS: Array<{ value: HumanDecision; label: string; helper: string }> = [
  { value: "ADMIT", label: "Admit", helper: "Accept this applicant into the program." },
  { value: "REJECT", label: "Reject", helper: "Deny admission for this applicant." },
  { value: "WAITLIST", label: "Waitlist", helper: "Hold applicant for later reconsideration." },
];

type DecisionTarget =
  | { mode: "single"; applicationId: string }
  | { mode: "batch"; applicationIds: string[] };

export default function ReviewPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sponsorshipFilter, setSponsorshipFilter] = useState<SponsorshipFilter>("ALL");
  const [aiDecisionFilter, setAiDecisionFilter] = useState<AiDecisionQueryFilter>("");

  const [students, setStudents] = useState<RequestState>(initialState);
  const [decisionResult, setDecisionResult] = useState<RequestState>(initialState);

  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [decisionValue, setDecisionValue] = useState<HumanDecision>("ADMIT");
  const [decisionRemarks, setDecisionRemarks] = useState<string>("");
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionFormError, setDecisionFormError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setStudents({ loading: true, error: null, data: null });
    try {
      const token = localStorage.getItem("admin_dashboard_token") ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;

      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const buildUrl = (sponsorshipType: "SELF_SPONSORED" | "GOVERNMENT") => {
        const url = new URL(`${base}/api/v1/undergraduate/review/students`);
        url.searchParams.set("sponsorship_type", sponsorshipType);
        const ai = aiDecisionFilter.trim();
        if (ai) url.searchParams.set("ai_recommended_decision", ai);
        return url.toString();
      };

      const [selfRes, govRes] = await Promise.all([
        fetch(buildUrl("SELF_SPONSORED"), { headers }),
        fetch(buildUrl("GOVERNMENT"), { headers }),
      ]);
      const selfData = await selfRes.json().catch(() => ({}));
      const govData = await govRes.json().catch(() => ({}));

      if (!selfRes.ok || !govRes.ok) {
        throw new Error("Could not load review queue.");
      }

      const selfItems = Array.isArray(selfData)
        ? selfData
        : selfData && typeof selfData === "object" && Array.isArray((selfData as { items?: unknown[] }).items)
          ? (selfData as { items: unknown[] }).items
          : [];
      const govItems = Array.isArray(govData)
        ? govData
        : govData && typeof govData === "object" && Array.isArray((govData as { items?: unknown[] }).items)
          ? (govData as { items: unknown[] }).items
          : [];

      const map = new Map<string, ReviewRow>();
      [...selfItems, ...govItems].forEach((item) => {
        if (!item || typeof item !== "object") return;
        const r = item as ReviewRow;
        const key = String(r.application_id ?? r.id ?? "");
        if (!key) return;
        if (!map.has(key)) map.set(key, r);
      });
      const list = Array.from(map.values());
      setStudents({ loading: false, error: null, data: list });
      setSelectedIds((prev) => prev.filter((id) => list.some((r) => String(r.application_id ?? r.id ?? "") === id)));
    } catch (e) {
      setStudents({
        loading: false,
        error: e instanceof Error ? e.message : "Could not load review queue.",
        data: null,
      });
    }
  }, [aiDecisionFilter]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadStudents();
    });
  }, [loadStudents]);

  const allRows = useMemo(() => {
    if (Array.isArray(students.data)) return students.data as ReviewRow[];
    return [];
  }, [students.data]);

  const rows = useMemo(() => {
    if (sponsorshipFilter === "ALL") return allRows;
    return allRows.filter(
      (r) => String(r.sponsorship_type ?? "").toUpperCase() === sponsorshipFilter
    );
  }, [allRows, sponsorshipFilter]);

  const allIds = useMemo(
    () => rows.map((row) => String(row.application_id ?? row.id ?? "")).filter(Boolean),
    [rows]
  );

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const openSingleDecision = (applicationId: string) => {
    setDecisionValue("ADMIT");
    setDecisionRemarks("");
    setDecisionFormError(null);
    setDecisionTarget({ mode: "single", applicationId });
  };

  const openBatchDecision = () => {
    if (selectedIds.length === 0) return;
    setDecisionValue("ADMIT");
    setDecisionRemarks("");
    setDecisionFormError(null);
    setDecisionTarget({ mode: "batch", applicationIds: [...selectedIds] });
  };

  const closeDecisionDialog = () => {
    if (decisionSubmitting) return;
    setDecisionTarget(null);
    setDecisionFormError(null);
  };

  const submitDecision = async () => {
    if (!decisionTarget) return;
    const trimmedRemarks = decisionRemarks.trim();
    if (!trimmedRemarks) {
      setDecisionFormError("Justification remarks are required.");
      return;
    }

    setDecisionFormError(null);
    setDecisionSubmitting(true);
    try {
      if (decisionTarget.mode === "single") {
        await callApi(
          setDecisionResult,
          `/api/v1/undergraduate/review/decide/${encodeURIComponent(decisionTarget.applicationId)}`,
          "POST",
          {
            human_decision: decisionValue,
            justification_remarks: trimmedRemarks,
          }
        );
      } else {
        await callApi(setDecisionResult, "/api/v1/undergraduate/review/decide/batch", "POST", {
          decisions: decisionTarget.applicationIds.map((application_id) => ({
            application_id,
            human_decision: decisionValue,
            justification_remarks: trimmedRemarks,
          })),
        });
        setSelectedIds([]);
      }
      setDecisionTarget(null);
      await loadStudents();
    } finally {
      setDecisionSubmitting(false);
    }
  };

  return (
    <div className="grid gap-5">
      <Section
        title="Students For Review"
        subtitle="Both sponsorship queues load together. Filter by sponsorship client-side; filter by AI decision via the API (optional query parameter)."
      >
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="sponsorship-filter" className="text-[12px] font-semibold text-[#3a3a3a]">
              Sponsorship
            </label>
            <select
              id="sponsorship-filter"
              value={sponsorshipFilter}
              onChange={(e) => {
                setSponsorshipFilter(e.target.value as SponsorshipFilter);
                setSelectedIds([]);
              }}
              className="h-[36px] min-w-[200px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] text-[#1a1a1a] outline-none"
            >
              <option value="ALL">All</option>
              <option value="SELF_SPONSORED">Self-sponsored</option>
              <option value="GOVERNMENT">Government</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="ai-decision-filter" className="text-[12px] font-semibold text-[#3a3a3a]">
              Ranking recommendations
            </label>
            <select
              id="ai-decision-filter"
              value={aiDecisionFilter}
              onChange={(e) => {
                setAiDecisionFilter(e.target.value as AiDecisionQueryFilter);
                setSelectedIds([]);
              }}
              className="h-[36px] min-w-[220px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] text-[#1a1a1a] outline-none"
            >
              <option value="">All (no filter)</option>
              {AI_DECISION_QUERY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {AI_DECISION_FILTER_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-3 flex items-center justify-between rounded-md border border-[#c7d9ed] bg-[#eef4ff] px-3 py-2">
            <p className="text-[12px] text-[#2a66a7]">
              {selectedIds.length} student{selectedIds.length > 1 ? "s" : ""} selected
            </p>
            <button
              type="button"
              onClick={openBatchDecision}
              className="h-[32px] rounded-md bg-[#3f79b5] px-3 text-[12px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
            >
              Decide Batch
            </button>
          </div>
        ) : null}

        <p className="mb-3 text-[13px] text-[#5a5a5a]">
          Showing <span className="font-semibold text-[#2f76b7]">{rows.length}</span>
          {sponsorshipFilter !== "ALL" ? (
            <>
              {" "}
              of <span className="font-semibold text-[#2f76b7]">{allRows.length}</span> loaded
            </>
          ) : null}
          {aiDecisionFilter ? (
            <>
              {" "}
              · Filter:{" "}
              <span className="font-semibold text-[#2f76b7]">
                {AI_DECISION_FILTER_LABELS[aiDecisionFilter as (typeof AI_DECISION_QUERY_VALUES)[number]] ??
                  aiDecisionFilter}
              </span>
            </>
          ) : null}
        </p>
        {students.loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading review queue…</p>
        ) : students.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {students.error}
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            {allRows.length > 0 && sponsorshipFilter !== "ALL"
              ? "No students match this sponsorship filter."
              : allRows.length === 0 && aiDecisionFilter
                ? "No students match the selected ranking recommendations filter."
                : "No students awaiting review."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[1180px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(allIds);
                        else setSelectedIds([]);
                      }}
                      aria-label="Select all students"
                    />
                  </th>
                  <th className="px-4 py-3">Ranking</th>
                  <th className="px-4 py-3">Admission #</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Sponsorship</th>
                  <th className="px-4 py-3">Stream</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="min-w-[140px] px-4 py-3">Ranking Recommendations</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const id = String(row.application_id ?? row.id ?? "");
                  return (
                    <tr
                      key={id || String(index)}
                      role={id ? "link" : undefined}
                      tabIndex={id ? 0 : -1}
                      className={`border-b border-gray-100 ${id ? "cursor-pointer hover:bg-[#eef4ff]/70" : ""}`}
                      onClick={() => {
                        if (id) router.push(`/review/${id}`);
                      }}
                      onKeyDown={(e) => {
                        if (!id) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (id) router.push(`/review/${id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          disabled={!id}
                          onChange={(e) => {
                            if (!id) return;
                            if (e.target.checked) {
                              setSelectedIds((prev) => Array.from(new Set([...prev, id])));
                            } else {
                              setSelectedIds((prev) => prev.filter((x) => x !== id));
                            }
                          }}
                          aria-label={`Select ${row.admission_number ?? id}`}
                        />
                      </td>
                     
                      <td className="px-4 py-3">{row.rank_position ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[#2f76b7]">
                        {row.admission_number ?? "—"}
                      </td>
                      <td className="px-4 py-3">{row.student_name ?? "—"}</td>
                      <td className="px-4 py-3">{row.sponsorship_type ?? "—"}</td>
                      <td className="px-4 py-3">{row.stream ?? "—"}</td>
                      <td className="px-4 py-3">{row.assigned_program_name ?? "—"}</td>
                      <td className="max-w-[220px] whitespace-normal break-words px-4 py-3 text-[12px]">
                        {row.ai_recommended_decision != null && String(row.ai_recommended_decision).trim() !== ""
                          ? String(row.ai_recommended_decision)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{row.status ?? row.current_status ?? "—"}</td>
                      <td className="px-4 py-3">
                        {typeof row.final_score === "number" ? row.final_score : "—"}
                      </td>
                     
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!id}
                          onClick={() => {
                            if (id) openSingleDecision(id);
                          }}
                          className="h-[30px] rounded-md bg-[#3f79b5] px-3 text-[11px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
                        >
                          Decide
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Decision Response</p>
          {decisionResult.loading ? (
            <p className="text-[13px] text-[#5a5a5a]">Deciding…</p>
          ) : decisionResult.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {decisionResult.error}
            </p>
          ) : decisionResult.data ? (
            <p className="text-[13px] font-semibold text-green-700">Decision made successfully.</p>
          ) : null}
        </div>
      </Section>

      {decisionTarget ? (
        <DecisionDialog
          target={decisionTarget}
          decision={decisionValue}
          onDecisionChange={setDecisionValue}
          remarks={decisionRemarks}
          onRemarksChange={setDecisionRemarks}
          onCancel={closeDecisionDialog}
          onConfirm={submitDecision}
          submitting={decisionSubmitting}
          error={decisionFormError}
        />
      ) : null}
    </div>
  );
}

function DecisionDialog({
  target,
  decision,
  onDecisionChange,
  remarks,
  onRemarksChange,
  onCancel,
  onConfirm,
  submitting,
  error,
}: {
  target: DecisionTarget;
  decision: HumanDecision;
  onDecisionChange: (value: HumanDecision) => void;
  remarks: string;
  onRemarksChange: (value: string) => void;
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

  const isBatch = target.mode === "batch";
  const count = isBatch ? target.applicationIds.length : 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
            {isBatch ? "Batch decision" : "Single decision"}
          </p>
          <h2 id="decision-dialog-title" className="mt-1 text-[18px] font-bold text-[#1a1a1a]">
            {isBatch
              ? `Decide ${count} student${count > 1 ? "s" : ""}`
              : "Decide this student"}
          </h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">
            {isBatch
              ? "Selected decision and remarks will be applied to every selected student."
              : "Select a decision and provide a justification for the audit trail."}
          </p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#3a3a3a]">
              Human decision
            </legend>
            <div className="grid gap-2">
              {DECISION_OPTIONS.map((option) => {
                const checked = decision === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors ${
                      checked
                        ? "border-[#3f79b5] bg-[#eef4ff]"
                        : "border-gray-200 bg-white hover:bg-[#f8fafc]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="human-decision"
                      value={option.value}
                      checked={checked}
                      onChange={() => onDecisionChange(option.value)}
                      className="mt-1"
                    />
                    <span className="block">
                      <span className="block text-[13px] font-semibold text-[#1a1a1a]">
                        {option.label}
                      </span>
                      <span className="block text-[11px] text-[#5a5a5a]">{option.helper}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="decision-remarks"
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#3a3a3a]"
            >
              Justification remarks
            </label>
            <textarea
              id="decision-remarks"
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              rows={4}
              placeholder="Explain the reasoning for this decision"
              className="w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 py-2 text-[13px] outline-none focus:border-[#3f79b5]"
            />
            <p className="mt-1 text-[11px] text-[#5a5a5a]">
              {isBatch
                ? "Same remarks will be sent for every selected student."
                : "Required to record the rationale for this decision."}
            </p>
          </div>

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
            className="h-[36px] min-w-[140px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
          >
            {submitting
              ? "Submitting…"
              : isBatch
                ? `Submit (${count})`
                : "Submit decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
