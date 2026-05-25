"use client";

import { Section } from "@/components/ApiHelpers";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type GradeSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "FLAGGED"
  | "REJECTED"
  | "AUTHORISED";

type AgentVerdict = "APPROVE" | "FLAG" | "PENDING";

type GradeLetter =
  | "A_PLUS" | "A" | "A_MINUS"
  | "B_PLUS" | "B" | "B_MINUS"
  | "C_PLUS" | "C" | "C_MINUS"
  | "D" | "F" | "I" | "W" | "NG";

type BreakdownComponent = {
  id: string;
  name: string;
  weight: number;
  max_score: number;
  order_index: number;
};

type Breakdown = {
  id: string;
  section_id: string;
  course_id: string;
  instructor_id: string;
  term_id: string;
  version: number;
  locked_at: string | null;
  components: BreakdownComponent[];
};

type ScoreCell = {
  student_id: string;
  component_id: string;
  score: number | null;
};

type BatchRow = {
  student_id: string;
  student_number: string;
  full_name: string;
  is_added_via_drop: boolean;
  is_complete: boolean;
  scores: ScoreCell[];
};

type BatchView = {
  id: string;
  section_id: string;
  section_code: string;
  section_semester: number;
  course_id: string;
  course_code: string;
  course_title: string;
  course_credit_hours: number;
  term_id: string;
  term_name: string;
  instructor_id: string;
  instructor_name: string;
  breakdown_id: string;
  status: GradeSubmissionStatus;
  iteration_count: number;
  submitted_at: string | null;
  instructor_justification: string | null;
  breakdown: Breakdown;
  rows: BatchRow[];
};

type StudentGradeRow = {
  student_id: string;
  student_number: string;
  full_name: string;
  numeric_score: number;
  letter_grade: GradeLetter;
};

type AgentReview = {
  id: string;
  iteration: number;
  verdict: AgentVerdict;
  flags: Array<Record<string, unknown>>;
  llm_reasoning: string | null;
  tool_findings: Record<string, unknown>;
  agent_id: string;
  created_at: string;
};

type DhDecisionKind =
  | "AUTHORISED"
  | "REJECTED"
  | "OVERRODE_AGENT_APPROVAL"
  | "OVERRODE_AGENT_FLAG";

type DhDecision = {
  id: string;
  iteration: number;
  decision: DhDecisionKind;
  department_head_id: string;
  decision_at: string;
  justification: string | null;
};

type ReviewPacket = {
  batch: BatchView;
  per_student_grades: StudentGradeRow[];
  agent_reviews: AgentReview[];
  decisions: DhDecision[];
};

type TabId = "scores" | "agent" | "justification" | "decisions";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

function formatLetter(letter: GradeLetter): string {
  switch (letter) {
    case "A_PLUS": return "A+";
    case "A_MINUS": return "A-";
    case "B_PLUS": return "B+";
    case "B_MINUS": return "B-";
    case "C_PLUS": return "C+";
    case "C_MINUS": return "C-";
    default: return letter;
  }
}

function letterTone(letter: GradeLetter): string {
  if (letter === "F" || letter === "NG") return "bg-[#fde0e0] text-[#a31a1a]";
  if (letter === "W" || letter === "I") return "bg-[#f1f3f5] text-[#3a3a3a]";
  if (letter.startsWith("A")) return "bg-[#dff1e4] text-[#1f7a3a]";
  if (letter.startsWith("B")) return "bg-[#eef4fa] text-[#1f5b94]";
  if (letter.startsWith("C")) return "bg-[#fff3d4] text-[#8a5a00]";
  return "bg-[#f1f3f5] text-[#3a3a3a]";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function semesterToYearLabel(semester: number | null | undefined): string {
  if (semester == null || !Number.isFinite(semester) || semester < 1) {
    return "Year — · Sem —";
  }
  const year = Math.ceil(semester / 2);
  const sem = ((semester - 1) % 2) + 1;
  return `Year ${year} · Sem ${sem}`;
}

// Grade workflow status — where the batch sits in the submit→authorise
// lifecycle (distinct from the agent's verdict below).
const GRADE_STATUS: Record<
  GradeSubmissionStatus,
  { label: string; title: string; cls: string }
> = {
  DRAFT: {
    label: "Draft",
    title: "Instructor is still editing — not submitted yet.",
    cls: "border-gray-300 bg-gray-50 text-gray-600",
  },
  SUBMITTED: {
    label: "Submitted — awaiting you",
    title: "Submitted by the instructor and waiting for your authorisation.",
    cls: "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]",
  },
  FLAGGED: {
    label: "Flagged — review needed",
    title: "The grading agent flagged this batch; review it before authorising.",
    cls: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]",
  },
  REJECTED: {
    label: "Returned to instructor",
    title: "You rejected this batch and sent it back to the instructor.",
    cls: "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]",
  },
  AUTHORISED: {
    label: "Authorised — official",
    title: "Grades are final and official.",
    cls: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]",
  },
};

// The grading agent's automated verdict on the batch.
const AGENT_VERDICT: Record<
  AgentVerdict,
  { label: string; title: string; cls: string }
> = {
  APPROVE: {
    label: "Approved",
    title: "The grading agent reviewed the batch and found no issues.",
    cls: "border-[#cae6cf] bg-[#ecf8ef] text-[#1f7a3a]",
  },
  FLAG: {
    label: "Flagged",
    title: "The grading agent flagged potential issues — read its reasoning below.",
    cls: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]",
  },
  PENDING: {
    label: "Pending",
    title: "The grading agent has not returned a verdict yet — rerun it.",
    cls: "border-gray-300 bg-gray-50 text-gray-600",
  },
};

function StatusPill({ status }: { status: GradeSubmissionStatus }) {
  const s = GRADE_STATUS[status];
  return (
    <span
      title={s.title}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function VerdictPill({ verdict }: { verdict: AgentVerdict | null }) {
  if (verdict == null) return null;
  const v = AGENT_VERDICT[verdict];
  return (
    <span
      title={v.title}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${v.cls}`}
    >
      {v.label}
    </span>
  );
}

export default function OfficerGradingBatchDetail() {
  const params = useParams<{ batchId: string }>();
  const batchId = params?.batchId ?? "";
  const [packet, setPacket] = useState<ReviewPacket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("scores");

  const [actionMode, setActionMode] = useState<"authorise" | "reject" | null>(null);
  const [justification, setJustification] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rerunBusy, setRerunBusy] = useState(false);

  const loadPacket = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/grading/officer/batches/${encodeURIComponent(batchId)}`,
        { headers: authHeaders() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Request failed")
            : "Could not load the review packet.";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      setPacket(data as ReviewPacket);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the review packet.");
      setPacket(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void loadPacket();
  }, [loadPacket]);

  const batch = packet?.batch ?? null;
  const latestVerdict =
    packet && packet.agent_reviews.length > 0
      ? packet.agent_reviews[0].verdict
      : null;

  const canDecide =
    batch?.status === "SUBMITTED" || batch?.status === "FLAGGED";
  const justificationRequiredForAuth = batch?.status === "FLAGGED";

  function openAction(mode: "authorise" | "reject") {
    setActionMode(mode);
    setJustification("");
    setActionError(null);
  }

  function closeAction() {
    if (actionBusy) return;
    setActionMode(null);
    setActionError(null);
  }

  async function submitAction() {
    if (!batch || !actionMode) return;
    const trimmed = justification.trim();
    const needsJustification =
      actionMode === "reject" ||
      (actionMode === "authorise" && justificationRequiredForAuth);
    if (needsJustification && trimmed.length < 3) {
      setActionError("A justification of at least 3 characters is required.");
      return;
    }
    setActionError(null);
    setActionBusy(true);
    try {
      const path = `/api/v1/courses/grading/officer/batches/${encodeURIComponent(batch.id)}/${actionMode}`;
      const body: Record<string, unknown> = {};
      if (trimmed) body.justification = trimmed;
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? typeof (data as { detail?: unknown }).detail === "string"
              ? String((data as { detail?: unknown }).detail)
              : JSON.stringify((data as { detail?: unknown }).detail)
            : "Decision failed";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      setActionMode(null);
      await loadPacket();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Decision failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function rerunAgent() {
    if (!batch) return;
    setRerunBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/courses/grading/officer/batches/${encodeURIComponent(batch.id)}/rerun-agent`,
        { method: "POST", headers: authHeaders() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Rerun failed")
            : "Rerun failed";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      await loadPacket();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rerun failed.");
    } finally {
      setRerunBusy(false);
    }
  }

  const gradesByStudent = useMemo(() => {
    const map = new Map<string, StudentGradeRow>();
    if (packet) {
      for (const g of packet.per_student_grades) map.set(g.student_id, g);
    }
    return map;
  }, [packet]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/officer/grading"
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2f76b7] hover:underline"
        >
          ← Back to queue
        </Link>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : loading || !batch || !packet ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading review packet…</p>
      ) : (
        <>
          {/* Header */}
          <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,120,183,0.15)_0%,transparent_70%)]" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f76b7]">
                  Grade batch review · iteration {batch.iteration_count}
                </p>
                <h1 className="mt-1 text-[22px] font-bold tracking-[-0.01em] text-[#1f2f40]">
                  <span className="font-mono text-[#1f5b94]">{batch.course_code}</span>
                  {" · "}
                  {batch.course_title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[#5a5a5a]">
                  <span>
                    <span className="font-semibold text-[#1f2f40]">
                      {semesterToYearLabel(batch.section_semester)}
                    </span>
                  </span>
                  <span>
                    Section <span className="font-semibold text-[#1f2f40]">{batch.section_code}</span>
                  </span>
                  <span>
                    Instructor{" "}
                    <span className="font-semibold text-[#1f2f40]">
                      {batch.instructor_name || "—"}
                    </span>
                  </span>
                  <span>{batch.course_credit_hours} cr</span>
                  <span>{batch.rows.length} students</span>
                  {batch.term_name ? <span>Term {batch.term_name}</span> : null}
                  <span>Submitted {formatDateTime(batch.submitted_at)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                    Grade status
                  </span>
                  <StatusPill status={batch.status} />
                </div>
                {latestVerdict ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#8a8a8a]">
                      Agent review
                    </span>
                    <VerdictPill verdict={latestVerdict} />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openAction("authorise")}
                disabled={!canDecide}
                title={
                  canDecide
                    ? "Authorise this batch — grades become official."
                    : "Authorise is only available when the batch is SUBMITTED or FLAGGED."
                }
                className="h-[38px] rounded-md bg-[#1f7a3a] px-4 text-[12.5px] font-semibold tracking-wide text-white hover:bg-[#1a6932] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {justificationRequiredForAuth
                  ? "Override flag & authorise"
                  : "Authorise"}
              </button>
              <button
                type="button"
                onClick={() => openAction("reject")}
                disabled={!canDecide}
                title={
                  canDecide
                    ? "Reject this batch — instructor must redo."
                    : "Reject is only available when the batch is SUBMITTED or FLAGGED."
                }
                className="h-[38px] rounded-md bg-[#a31a1a] px-4 text-[12.5px] font-semibold tracking-wide text-white hover:bg-[#8a1414] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>
              {latestVerdict === "PENDING" && canDecide ? (
                <button
                  type="button"
                  onClick={() => void rerunAgent()}
                  disabled={rerunBusy}
                  className="h-[38px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[12.5px] font-semibold tracking-wide text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
                >
                  {rerunBusy ? "Rerunning…" : "Rerun agent"}
                </button>
              ) : null}
              {!canDecide ? (
                <span className="self-center text-[12px] italic text-[#5a5a5a]">
                  This batch is finalised — no further DH action is available.
                </span>
              ) : null}
            </div>
          </div>

          {/* Tabs */}
          <div className="aau-card overflow-hidden rounded-2xl">
            <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-[#f8fafc] px-3 py-2">
              {(
                [
                  { id: "scores", label: "Scores & grades" },
                  { id: "agent", label: `Agent reviews (${packet.agent_reviews.length})` },
                  {
                    id: "justification",
                    label: batch.instructor_justification
                      ? "Instructor justification ✓"
                      : "Instructor justification",
                  },
                  { id: "decisions", label: `Decisions (${packet.decisions.length})` },
                ] as { id: TabId; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    tab === t.id
                      ? "bg-white text-[#1f5b94] shadow-[0_1px_0_rgba(15,23,42,0.08)]"
                      : "text-[#5a5a5a] hover:bg-white/60 hover:text-[#1f5b94]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-5 py-4">
              {tab === "scores" ? (
                <ScoresTab
                  batch={batch}
                  gradesByStudent={gradesByStudent}
                />
              ) : tab === "agent" ? (
                <AgentReviewsTab reviews={packet.agent_reviews} />
              ) : tab === "justification" ? (
                <JustificationTab justification={batch.instructor_justification} />
              ) : (
                <DecisionsTab decisions={packet.decisions} />
              )}
            </div>
          </div>
        </>
      )}

      {actionMode && batch ? (
        <DecisionDialog
          mode={actionMode}
          justificationRequired={
            actionMode === "reject" || justificationRequiredForAuth
          }
          justification={justification}
          onJustificationChange={setJustification}
          onCancel={closeAction}
          onConfirm={() => void submitAction()}
          busy={actionBusy}
          error={actionError}
        />
      ) : null}
    </div>
  );
}

function ScoresTab({
  batch,
  gradesByStudent,
}: {
  batch: BatchView;
  gradesByStudent: Map<string, { numeric_score: number; letter_grade: GradeLetter }>;
}) {
  const sortedComponents = useMemo(
    () => [...batch.breakdown.components].sort((a, b) => a.order_index - b.order_index),
    [batch.breakdown.components],
  );

  const sortedRows = useMemo(() => {
    const scoreFor = (sid: string) =>
      gradesByStudent.get(sid)?.numeric_score ?? null;
    return [...batch.rows].sort((a, b) => {
      const sa = scoreFor(a.student_id);
      const sb = scoreFor(b.student_id);
      // Students without a computed grade fall to the bottom.
      if (sa === null && sb === null) return a.full_name.localeCompare(b.full_name);
      if (sa === null) return 1;
      if (sb === null) return -1;
      if (sb !== sa) return sb - sa; // descending
      return a.full_name.localeCompare(b.full_name);
    });
  }, [batch.rows, gradesByStudent]);

  return (
    <Section
      title="Score matrix"
      subtitle="Read-only view of the instructor's per-student × per-component grid. Each cell shows the component's weighted contribution toward the final 100. Sorted by final numeric score (highest first)."
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
        {sortedComponents.map((c) => (
          <span
            key={c.id}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[#3a3a3a]"
          >
            <span className="font-semibold text-[#1f2f40]">{c.name}</span>
            <span className="ml-1 text-[#5a5a5a]">
              · weight {c.weight} (raw out of {c.max_score})
            </span>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[860px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
              <th className="px-3 py-2 text-right">#</th>
              <th className="px-3 py-2">Student</th>
              {sortedComponents.map((c) => (
                <th key={c.id} className="px-3 py-2 text-right">
                  {c.name}
                  <span className="ml-1 font-normal normal-case text-[10px] text-[#5a5a5a]">
                    /{c.weight}
                  </span>
                </th>
              ))}
              <th className="px-3 py-2 text-right">Numeric</th>
              <th className="px-3 py-2 text-center">Letter</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, idx) => {
              const scoresByComp = new Map<string, number | null>();
              for (const s of row.scores) scoresByComp.set(s.component_id, s.score);
              const grade = gradesByStudent.get(row.student_id);
              return (
                <tr key={row.student_id} className="border-b border-gray-100">
                  <td className="px-3 py-2 text-right tabular-nums text-[#5a5a5a]">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold text-[#1f2f40]">{row.full_name}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#5a5a5a]">
                        {row.student_number}
                      </span>
                      {row.is_added_via_drop ? (
                        <span className="rounded-full bg-[#fff3d4] px-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a5a00]">
                          add/drop
                        </span>
                      ) : null}
                      {!row.is_complete ? (
                        <span className="rounded-full bg-[#fde0e0] px-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#a31a1a]">
                          incomplete
                        </span>
                      ) : null}
                    </div>
                  </td>
                  {sortedComponents.map((c) => {
                    const raw = scoresByComp.get(c.id);
                    const weighted =
                      raw == null || c.max_score === 0
                        ? null
                        : (raw / c.max_score) * c.weight;
                    return (
                      <td
                        key={c.id}
                        className="px-3 py-2 text-right tabular-nums text-[#1f2f40]"
                        title={
                          raw == null
                            ? undefined
                            : `Raw ${raw} / ${c.max_score} × weight ${c.weight}`
                        }
                      >
                        {weighted == null ? "—" : weighted.toFixed(2)}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1f5b94]">
                    {grade == null ? "—" : grade.numeric_score.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {grade == null ? (
                      "—"
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-bold ${letterTone(grade.letter_grade)}`}
                      >
                        {formatLetter(grade.letter_grade)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function formatFlagType(raw: string): string {
  return raw
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function FlagCard({ flag }: { flag: Record<string, unknown> }) {
  const type = typeof flag.type === "string" ? flag.type : null;
  const severityRaw =
    typeof flag.severity === "string" ? flag.severity.toUpperCase() : null;
  const message = typeof flag.message === "string" ? flag.message : null;
  const affected = Array.isArray(flag.affected_students)
    ? (flag.affected_students as unknown[])
    : [];

  const knownKeys = new Set(["type", "severity", "message", "affected_students"]);
  const extras = Object.entries(flag).filter(([k]) => !knownKeys.has(k));

  const severityStyle = (() => {
    switch (severityRaw) {
      case "HIGH":
      case "CRITICAL":
        return "border-[#f0bcbc] bg-[#fdebeb] text-[#a31a1a]";
      case "MEDIUM":
      case "WARN":
      case "WARNING":
        return "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]";
      case "LOW":
      case "INFO":
        return "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]";
      default:
        return "border-gray-300 bg-gray-50 text-gray-700";
    }
  })();

  return (
    <div className="rounded-md border border-[#f0bcbc] bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        {severityRaw ? (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${severityStyle}`}
          >
            {severityRaw}
          </span>
        ) : null}
        {type ? (
          <span className="text-[12px] font-semibold text-[#1f2f40]">
            {formatFlagType(type)}
          </span>
        ) : null}
      </div>

      {message ? (
        <p className="mt-2 whitespace-pre-wrap text-[12.5px] text-[#1f2f40]">
          {message}
        </p>
      ) : null}

      {affected.length > 0 ? (
        <div className="mt-2 rounded-md border border-gray-200 bg-[#fafbfc] p-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
            Affected students ({affected.length})
          </p>
          <ul className="mt-1 space-y-1 text-[12px] text-[#3a3a3a]">
            {affected.map((row, i) => {
              if (row && typeof row === "object") {
                const r = row as Record<string, unknown>;
                const name =
                  typeof r.full_name === "string"
                    ? r.full_name
                    : typeof r.student_number === "string"
                      ? r.student_number
                      : typeof r.name === "string"
                        ? r.name
                        : null;
                const id =
                  typeof r.student_number === "string"
                    ? r.student_number
                    : typeof r.student_id === "string"
                      ? r.student_id
                      : null;
                if (name || id) {
                  return (
                    <li key={`affected-${i}`}>
                      {name ? (
                        <span className="font-semibold text-[#1f2f40]">
                          {name}
                        </span>
                      ) : null}
                      {name && id && id !== name ? (
                        <span className="ml-2 font-mono text-[11px] text-[#5a5a5a]">
                          {id}
                        </span>
                      ) : id ? (
                        <span className="font-mono text-[11px]">{id}</span>
                      ) : null}
                    </li>
                  );
                }
              }
              return (
                <li key={`affected-${i}`} className="font-mono text-[11px]">
                  {String(row)}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {extras.length > 0 ? (
        <details className="mt-2 text-[11.5px] text-[#5a5a5a]">
          <summary className="cursor-pointer font-semibold uppercase tracking-wide">
            More detail
          </summary>
          <pre className="mt-1 max-h-[180px] overflow-auto rounded bg-[#f8fafc] p-2 text-[11px] text-[#3a3a3a]">
            {JSON.stringify(Object.fromEntries(extras), null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function AgentReviewsTab({ reviews }: { reviews: AgentReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
        No agent runs recorded for this batch yet.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {reviews.map((r, idx) => (
        <details
          key={r.id}
          open={idx === 0}
          className="rounded-md border border-gray-200 bg-white"
        >
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5a5a5a]">
                Iteration {r.iteration}
              </span>
              <VerdictPill verdict={r.verdict} />
              {r.flags.length > 0 ? (
                <span className="rounded-full bg-[#fde0e0] px-2 py-0.5 text-[11px] font-semibold text-[#a31a1a]">
                  {r.flags.length} flag{r.flags.length === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <span className="text-[11px] text-[#5a5a5a]">
              {formatDateTime(r.created_at)}
            </span>
          </summary>
          <div className="border-t border-gray-100 px-4 py-3 text-[12.5px]">
            {r.llm_reasoning ? (
              <div className="mb-3 whitespace-pre-wrap text-[#1f2f40]">
                {r.llm_reasoning}
              </div>
            ) : (
              <p className="mb-3 italic text-[#5a5a5a]">No reasoning recorded.</p>
            )}
            {r.flags.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a31a1a]">
                  Flags ({r.flags.length})
                </p>
                <ul className="space-y-2">
                  {r.flags.map((f, i) => (
                    <li key={`${r.id}-flag-${i}`}>
                      <FlagCard flag={f} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function JustificationTab({ justification }: { justification: string | null }) {
  if (!justification || justification.trim() === "") {
    return (
      <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
        The instructor has not attached a justification to this batch.
      </p>
    );
  }
  return (
    <div className="rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-4 py-3 text-[13px] text-[#1f2f40]">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a5a00]">
        Instructor explanation
      </p>
      <p className="whitespace-pre-wrap">{justification}</p>
    </div>
  );
}

function DecisionsTab({ decisions }: { decisions: DhDecision[] }) {
  if (decisions.length === 0) {
    return (
      <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
        No DH decisions yet — this is iteration 1.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {decisions.map((d) => (
        <li key={d.id} className="rounded-md border border-gray-200 bg-white p-3 text-[12.5px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#eef4fa] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1f5b94]">
                Iter {d.iteration}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  d.decision.includes("AUTHORISED") || d.decision === "OVERRODE_AGENT_FLAG"
                    ? "bg-[#ecf8ef] text-[#1f7a3a]"
                    : "bg-[#fdebeb] text-[#a31a1a]"
                }`}
              >
                {d.decision.replaceAll("_", " ")}
              </span>
            </div>
            <span className="text-[11px] text-[#5a5a5a]">
              {formatDateTime(d.decision_at)}
            </span>
          </div>
          {d.justification ? (
            <p className="mt-2 whitespace-pre-wrap text-[#1f2f40]">
              {d.justification}
            </p>
          ) : (
            <p className="mt-2 italic text-[#5a5a5a]">No justification.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function DecisionDialog({
  mode,
  justificationRequired,
  justification,
  onJustificationChange,
  onCancel,
  onConfirm,
  busy,
  error,
}: {
  mode: "authorise" | "reject";
  justificationRequired: boolean;
  justification: string;
  onJustificationChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
  error: string | null;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const meta =
    mode === "authorise"
      ? {
          title: justificationRequired
            ? "Override the agent flag and authorise"
            : "Authorise this batch",
          helper: justificationRequired
            ? "The grading agent flagged this batch. Authorising marks the grades AUTHORISED and overrides the agent — please record why."
            : "The grading agent approved this batch. Authorising marks every grade as official and visible to students.",
          confirm: "Authorise",
          tone: "bg-[#1f7a3a] hover:bg-[#1a6932]",
        }
      : {
          title: "Reject this batch",
          helper:
            "Rejection sends the batch back to the instructor. They will see your justification and must reopen + resubmit.",
          confirm: "Reject batch",
          tone: "bg-[#a31a1a] hover:bg-[#8a1414]",
        };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-6 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
            Department head decision · {mode}
          </p>
          <h2 className="mt-1 text-[18px] font-bold text-[#1a1a1a]">{meta.title}</h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">{meta.helper}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          {justificationRequired ? (
            <div>
              <label
                htmlFor="dh-justification"
                className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#3a3a3a]"
              >
                Justification (required)
              </label>
              <textarea
                id="dh-justification"
                value={justification}
                onChange={(e) => onJustificationChange(e.target.value)}
                rows={5}
                placeholder="Explain the reasoning for the audit trail"
                className="w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 py-2 text-[13px] outline-none focus:border-[#3f79b5]"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="dh-justification-optional"
                className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#3a3a3a]"
              >
                Notes (optional)
              </label>
              <textarea
                id="dh-justification-optional"
                value={justification}
                onChange={(e) => onJustificationChange(e.target.value)}
                rows={4}
                placeholder="Optional context for the audit log"
                className="w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 py-2 text-[13px] outline-none focus:border-[#3f79b5]"
              />
            </div>
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
            disabled={busy}
            className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[13px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-[36px] min-w-[140px] rounded-md px-4 text-[13px] font-semibold text-white disabled:opacity-60 ${meta.tone}`}
          >
            {busy ? "Submitting…" : meta.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
