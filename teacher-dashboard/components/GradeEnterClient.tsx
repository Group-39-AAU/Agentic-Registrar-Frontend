"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  describeIncomplete,
  fetchBreakdown,
  formatLetter,
  getOrCreateBatch,
  justifyBatch,
  listAgentReviews,
  reopenBatch,
  submitBatch,
  upsertBreakdown,
  upsertScores,
  type AgentReview,
  type AgentVerdict,
  type ComponentInput,
  type GradeBatch,
  type GradeBatchSubmitResponse,
} from "@/lib/gradingApi";

type ScoresMap = Record<string, Record<string, string>>; // student_id -> component_id -> string

function totalWeight(rows: { weight: string }[]): number {
  return rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);
}

function StatusPill({ status }: { status: GradeBatch["status"] }) {
  const map: Record<GradeBatch["status"], string> = {
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

function VerdictPill({ verdict }: { verdict: AgentVerdict }) {
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

export default function GradeEnterClient() {
  const router = useRouter();
  const params = useSearchParams();
  const sectionId = params.get("section_id") ?? "";
  const courseId = params.get("course_id") ?? "";
  const termId = params.get("term_id") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [breakdownExists, setBreakdownExists] = useState<boolean>(false);
  const [batch, setBatch] = useState<GradeBatch | null>(null);

  const [draftComponents, setDraftComponents] = useState<
    { name: string; weight: string; max_score: string }[]
  >([{ name: "", weight: "", max_score: "" }]);
  const [breakdownBusy, setBreakdownBusy] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  const [scores, setScores] = useState<ScoresMap>({});
  const [scoreSaveBusy, setScoreSaveBusy] = useState(false);
  const [scoreSaveError, setScoreSaveError] = useState<string | null>(null);
  const [scoreSaveMsg, setScoreSaveMsg] = useState<string | null>(null);

  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] =
    useState<GradeBatchSubmitResponse | null>(null);

  const [justifyText, setJustifyText] = useState("");
  const [justifyBusy, setJustifyBusy] = useState(false);
  const [reopenBusy, setReopenBusy] = useState(false);

  const [reviews, setReviews] = useState<AgentReview[]>([]);

  const seedScoresFromBatch = useCallback((b: GradeBatch) => {
    const next: ScoresMap = {};
    for (const row of b.rows) {
      const cellMap: Record<string, string> = {};
      for (const cell of row.scores) {
        cellMap[cell.component_id] =
          cell.score == null ? "" : String(cell.score);
      }
      next[row.student_id] = cellMap;
    }
    setScores(next);
  }, []);

  const refreshBatchAndReviews = useCallback(
    async (sid: string, cid: string) => {
      const b = await getOrCreateBatch(sid, cid);
      setBatch(b);
      seedScoresFromBatch(b);
      try {
        const r = await listAgentReviews(b.id);
        setReviews(r);
      } catch {
        // Agent review history is best-effort.
      }
    },
    [seedScoresFromBatch],
  );

  const loadInitial = useCallback(async () => {
    if (!sectionId || !courseId) {
      setError("Missing section_id or course_id in the URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bd = await fetchBreakdown(sectionId, courseId);
      if (bd == null) {
        setBreakdownExists(false);
        setBatch(null);
        setLoading(false);
        return;
      }
      setBreakdownExists(true);
      await refreshBatchAndReviews(sectionId, courseId);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 403) {
          setError("You aren't assigned to teach this (section, course) pair.");
        } else if (e.status === 401) {
          setError("Your session has expired — please log in again.");
        } else {
          setError(e.message ?? "Could not load the grading workspace.");
        }
      } else {
        setError("Could not load the grading workspace.");
      }
    } finally {
      setLoading(false);
    }
  }, [sectionId, courseId, refreshBatchAndReviews]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  function addComponentRow() {
    setDraftComponents((rows) => [
      ...rows,
      { name: "", weight: "", max_score: "" },
    ]);
  }
  function removeComponentRow(idx: number) {
    setDraftComponents((rows) =>
      rows.length === 1 ? rows : rows.filter((_, i) => i !== idx),
    );
  }
  function updateComponentRow(
    idx: number,
    key: "name" | "weight" | "max_score",
    value: string,
  ) {
    setDraftComponents((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  }

  async function saveBreakdown() {
    setBreakdownError(null);
    const cleaned: ComponentInput[] = [];
    for (const row of draftComponents) {
      const name = row.name.trim();
      const weight = Number(row.weight);
      if (!name) {
        setBreakdownError("Every component needs a name.");
        return;
      }
      if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
        setBreakdownError(
          `Component "${name}" needs a positive weight up to 100.`,
        );
        return;
      }
      const maxRaw = row.max_score.trim();
      const max = maxRaw === "" ? weight : Number(maxRaw);
      if (!Number.isFinite(max) || max <= 0) {
        setBreakdownError(
          `Component "${name}" needs a positive max score (or leave blank to default to its weight).`,
        );
        return;
      }
      cleaned.push({ name, weight, max_score: max });
    }
    if (Math.abs(cleaned.reduce((s, c) => s + c.weight, 0) - 100) > 0.01) {
      setBreakdownError("Weights must sum to exactly 100.");
      return;
    }
    setBreakdownBusy(true);
    try {
      await upsertBreakdown(sectionId, courseId, cleaned);
      setBreakdownExists(true);
      await refreshBatchAndReviews(sectionId, courseId);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setBreakdownError(e.message ?? "Could not save the breakdown.");
      } else {
        setBreakdownError("Could not save the breakdown.");
      }
    } finally {
      setBreakdownBusy(false);
    }
  }

  function setCell(studentId: string, componentId: string, value: string) {
    setScoreSaveMsg(null);
    setScores((prev) => {
      const row = { ...(prev[studentId] ?? {}) };
      row[componentId] = value;
      return { ...prev, [studentId]: row };
    });
  }

  async function saveAllScores() {
    if (!batch) return;
    setScoreSaveError(null);
    setScoreSaveMsg(null);
    const cells: { student_id: string; component_id: string; score: number | null }[] = [];
    for (const row of batch.rows) {
      const sm = scores[row.student_id] ?? {};
      for (const comp of batch.breakdown.components) {
        const raw = (sm[comp.id] ?? "").trim();
        if (raw === "") {
          cells.push({
            student_id: row.student_id,
            component_id: comp.id,
            score: null,
          });
          continue;
        }
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0) {
          setScoreSaveError(
            `"${row.full_name}" / "${comp.name}" — score must be a non-negative number (or blank).`,
          );
          return;
        }
        if (num > comp.max_score) {
          setScoreSaveError(
            `"${row.full_name}" / "${comp.name}" — score ${num} exceeds the max of ${comp.max_score}.`,
          );
          return;
        }
        cells.push({
          student_id: row.student_id,
          component_id: comp.id,
          score: num,
        });
      }
    }
    if (cells.length === 0) {
      setScoreSaveError("No cells to save.");
      return;
    }
    setScoreSaveBusy(true);
    try {
      const next = await upsertScores(batch.id, cells);
      setBatch(next);
      seedScoresFromBatch(next);
      setScoreSaveMsg("Scores saved.");
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setScoreSaveError(e.message ?? "Could not save scores.");
      } else {
        setScoreSaveError("Could not save scores.");
      }
    } finally {
      setScoreSaveBusy(false);
    }
  }

  async function doSubmit() {
    if (!batch) return;
    setSubmitError(null);
    setSubmitResult(null);
    setSubmitBusy(true);
    try {
      const res = await submitBatch(batch.id);
      setSubmitResult(res);
      await refreshBatchAndReviews(sectionId, courseId);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 422) {
          const lines = describeIncomplete(e.body);
          setSubmitError(
            lines.length > 0
              ? `Cannot submit — missing scores:\n• ${lines.join("\n• ")}`
              : e.message ?? "Submission failed.",
          );
        } else {
          setSubmitError(e.message ?? "Submission failed.");
        }
      } else {
        setSubmitError("Submission failed.");
      }
    } finally {
      setSubmitBusy(false);
    }
  }

  async function doJustify() {
    if (!batch) return;
    if (justifyText.trim().length < 10) {
      setSubmitError(
        "Justification must be at least 10 characters so the agent has context.",
      );
      return;
    }
    setSubmitError(null);
    setJustifyBusy(true);
    try {
      const res = await justifyBatch(batch.id, justifyText.trim());
      setSubmitResult(res);
      setJustifyText("");
      await refreshBatchAndReviews(sectionId, courseId);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setSubmitError(e.message ?? "Could not submit the justification.");
      } else {
        setSubmitError("Could not submit the justification.");
      }
    } finally {
      setJustifyBusy(false);
    }
  }

  async function doReopen() {
    if (!batch) return;
    setSubmitError(null);
    setSubmitResult(null);
    setReopenBusy(true);
    try {
      const next = await reopenBatch(batch.id);
      setBatch(next);
      seedScoresFromBatch(next);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setSubmitError(e.message ?? "Could not reopen the batch.");
      } else {
        setSubmitError("Could not reopen the batch.");
      }
    } finally {
      setReopenBusy(false);
    }
  }

  const isEditable = batch?.status === "DRAFT";
  const latestReview = reviews.length > 0 ? reviews[0] : null;
  const breakdownDraftSum = totalWeight(draftComponents);
  const incompleteCount = useMemo(
    () => (batch ? batch.rows.filter((r) => !r.is_complete).length : 0),
    [batch],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/courses"
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2f76b7] hover:underline"
        >
          ← Back to my courses
        </Link>
        {termId ? (
          <p className="text-[11px] text-[#5a5a5a]">
            Term <span className="font-mono">{termId.slice(0, 8)}…</span>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : loading ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading the grading workspace…</p>
      ) : !breakdownExists ? (
        <BreakdownEditor
          rows={draftComponents}
          totalWeight={breakdownDraftSum}
          busy={breakdownBusy}
          error={breakdownError}
          onAdd={addComponentRow}
          onRemove={removeComponentRow}
          onChange={updateComponentRow}
          onSave={saveBreakdown}
        />
      ) : batch ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[20px] font-bold text-[#1f2f40]">
                  <span className="font-mono text-[#1f5b94]">
                    {batch.course_code}
                  </span>{" "}
                  · {batch.course_title}
                </h1>
                <p className="mt-1 text-[12.5px] text-[#5a5a5a]">
                  Section <strong>{batch.section_code}</strong> ·{" "}
                  {batch.rows.length} students · iteration{" "}
                  {batch.iteration_count}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusPill status={batch.status} />
                {latestReview ? <VerdictPill verdict={latestReview.verdict} /> : null}
              </div>
            </div>

            {batch.instructor_justification ? (
              <div className="mt-4 rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-3 py-2 text-[12.5px] text-[#1f2f40]">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8a5a00]">
                  Latest justification
                </p>
                <p className="whitespace-pre-wrap">{batch.instructor_justification}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-bold text-[#1f2f40]">
                Assessment breakdown
              </h2>
              <span className="text-[11px] text-[#5a5a5a]">
                {batch.breakdown.locked_at
                  ? "Locked — scores already entered"
                  : "Unlocked"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {batch.breakdown.components
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map((c) => (
                  <div
                    key={c.id}
                    className="rounded-md border border-gray-200 bg-[#fafbfc] px-3 py-2 text-[12.5px]"
                  >
                    <p className="font-semibold text-[#1f2f40]">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-[#5a5a5a]">
                      weight {c.weight} · out of {c.max_score}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <ScoreMatrix
            batch={batch}
            scores={scores}
            disabled={!isEditable}
            onCellChange={setCell}
          />

          {!isEditable ? (
            <p className="rounded-md border border-[#cfddec] bg-[#eef4fa] px-3 py-2 text-[12px] text-[#1f5b94]">
              This batch is in <strong>{batch.status}</strong>. Reopen it to edit
              scores again.
            </p>
          ) : null}

          {scoreSaveError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {scoreSaveError}
            </p>
          ) : null}
          {scoreSaveMsg ? (
            <p className="rounded-md border border-[#cae6cf] bg-[#ecf8ef] px-3 py-2 text-[12px] text-[#1f7a3a]">
              {scoreSaveMsg}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-[12px] text-[#5a5a5a]">
              {incompleteCount === 0
                ? "All students have a score in every component — ready to submit."
                : `${incompleteCount} student${incompleteCount === 1 ? "" : "s"} still missing at least one score.`}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isEditable ? (
                <>
                  <button
                    type="button"
                    onClick={() => void saveAllScores()}
                    disabled={scoreSaveBusy}
                    className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[12.5px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
                  >
                    {scoreSaveBusy ? "Saving…" : "Save scores"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void doSubmit()}
                    disabled={submitBusy || incompleteCount > 0}
                    title={
                      incompleteCount > 0
                        ? "Fill every cell before submitting."
                        : "Submit for agent review and department-head decision."
                    }
                    className="h-[36px] rounded-md bg-[#1f7a3a] px-4 text-[12.5px] font-semibold text-white hover:bg-[#1a6932] disabled:opacity-60"
                  >
                    {submitBusy ? "Submitting…" : "Submit for review"}
                  </button>
                </>
              ) : null}

              {batch.status === "FLAGGED" || batch.status === "REJECTED" ? (
                <button
                  type="button"
                  onClick={() => void doReopen()}
                  disabled={reopenBusy}
                  className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[12.5px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
                >
                  {reopenBusy ? "Reopening…" : "Reopen for editing"}
                </button>
              ) : null}
            </div>
          </div>

          {submitError ? (
            <p className="whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {submitError}
            </p>
          ) : null}

          {submitResult ? (
            <div className="space-y-3 rounded-xl border border-[#cfddec] bg-[#f6f9fc] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[14px] font-bold text-[#1f2f40]">
                  Submission result
                </h3>
                <VerdictPill verdict={submitResult.agent_verdict} />
              </div>
              <p className="text-[12.5px] text-[#1f2f40]">
                Status: <strong>{submitResult.status}</strong> · iteration{" "}
                {submitResult.iteration}
              </p>
              {submitResult.agent_reasoning ? (
                <p className="whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-3 text-[12.5px] text-[#1f2f40]">
                  {submitResult.agent_reasoning}
                </p>
              ) : null}
              {submitResult.agent_flags.length > 0 ? (
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#a31a1a]">
                    Flags
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-[12px] text-[#3a3a3a]">
                    {submitResult.agent_flags.map((f, i) => (
                      <li key={`flag-${i}`}>
                        <code className="break-all text-[11.5px] text-[#1f2f40]">
                          {JSON.stringify(f)}
                        </code>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="bg-[#f8fafc] text-[11px] uppercase tracking-wide text-[#5a5a5a]">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2 text-right">Numeric</th>
                      <th className="px-3 py-2 text-center">Letter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submitResult.grades.map((g) => (
                      <tr key={g.student_id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-[#1f2f40]">
                            {g.full_name}
                          </div>
                          <div className="font-mono text-[11px] text-[#5a5a5a]">
                            {g.student_number}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1f5b94]">
                          {g.numeric_score.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center font-bold">
                          {formatLetter(g.letter_grade)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {batch.status === "FLAGGED" ? (
            <div className="rounded-xl border border-[#f0d9a0] bg-[#fff7e2] p-4">
              <h3 className="text-[14px] font-bold text-[#1f2f40]">
                Respond to the agent&apos;s flags
              </h3>
              <p className="mt-1 text-[12.5px] text-[#5a5a5a]">
                Submitting a justification keeps the batch SUBMITTED/FLAGGED but
                re-runs the agent with your reasoning attached. Use{" "}
                <em>Reopen</em> if you need to change the scores instead.
              </p>
              <textarea
                value={justifyText}
                onChange={(e) => setJustifyText(e.target.value)}
                rows={4}
                placeholder="Explain why the agent's concerns are unfounded (≥ 10 characters)"
                className="mt-3 w-full rounded-md border border-[#9bb0cc] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#3f79b5]"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => void doJustify()}
                  disabled={justifyBusy}
                  className="h-[36px] rounded-md bg-[#8a5a00] px-4 text-[12.5px] font-semibold text-white hover:bg-[#714900] disabled:opacity-60"
                >
                  {justifyBusy ? "Submitting…" : "Submit justification"}
                </button>
              </div>
            </div>
          ) : null}

          {reviews.length > 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-[14px] font-bold text-[#1f2f40]">
                Agent review history
              </h3>
              <ul className="mt-3 space-y-2">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-md border border-gray-200 bg-[#fafbfc] p-3 text-[12.5px]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                          Iter {r.iteration}
                        </span>
                        <VerdictPill verdict={r.verdict} />
                      </div>
                      <span className="text-[11px] text-[#5a5a5a]">
                        {new Date(r.created_at).toLocaleString()}
                      </span>
                    </div>
                    {r.llm_reasoning ? (
                      <p className="mt-2 whitespace-pre-wrap text-[#1f2f40]">
                        {r.llm_reasoning}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          No grade batch — try reloading.
        </p>
      )}

      {error && error.toLowerCase().includes("session has expired") ? (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="h-[34px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff]"
        >
          Go to login
        </button>
      ) : null}
    </div>
  );
}

function BreakdownEditor({
  rows,
  totalWeight,
  busy,
  error,
  onAdd,
  onRemove,
  onChange,
  onSave,
}: {
  rows: { name: string; weight: string; max_score: string }[];
  totalWeight: number;
  busy: boolean;
  error: string | null;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (
    idx: number,
    key: "name" | "weight" | "max_score",
    value: string,
  ) => void;
  onSave: () => void;
}) {
  const sumOk = Math.abs(totalWeight - 100) < 0.01;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-[16px] font-bold text-[#1f2f40]">
        Define your assessment breakdown
      </h2>
      <p className="mt-1 text-[13px] text-[#5a5a5a]">
        Add the components you actually use in this course — e.g. <em>Midterm</em>,{" "}
        <em>Final exam</em>, <em>Project</em>. Weights must sum to{" "}
        <strong>100</strong>. <em>Out of</em> defaults to the weight when blank,
        so you can grade out of any scale you like.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-right">Weight</th>
              <th className="px-3 py-2 text-right">Out of</th>
              <th className="px-3 py-2 text-right">Remove</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="px-3 py-2">
                  <input
                    value={r.name}
                    onChange={(e) => onChange(i, "name", e.target.value)}
                    placeholder="e.g. Midterm"
                    className="h-[34px] w-full rounded-md border border-[#9bb0cc] bg-white px-2 text-[13px] outline-none focus:border-[#2f76b7]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.weight}
                    onChange={(e) => onChange(i, "weight", e.target.value)}
                    placeholder="30"
                    inputMode="decimal"
                    className="h-[34px] w-full rounded-md border border-[#9bb0cc] bg-white px-2 text-right text-[13px] outline-none focus:border-[#2f76b7]"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={r.max_score}
                    onChange={(e) => onChange(i, "max_score", e.target.value)}
                    placeholder="(weight)"
                    inputMode="decimal"
                    className="h-[34px] w-full rounded-md border border-[#9bb0cc] bg-white px-2 text-right text-[13px] outline-none focus:border-[#2f76b7]"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(i)}
                    disabled={rows.length === 1}
                    className="text-[12px] font-semibold text-[#a31a1a] hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="h-[34px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff]"
        >
          + Add component
        </button>
        <p
          className={`text-[12px] font-semibold ${sumOk ? "text-[#1f7a3a]" : "text-[#a31a1a]"}`}
        >
          Total weight: {totalWeight.toFixed(2)} / 100
        </p>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={busy || !sumOk}
          className="h-[40px] rounded-md bg-[#3f79b5] px-6 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save breakdown"}
        </button>
      </div>
    </div>
  );
}

function ScoreMatrix({
  batch,
  scores,
  disabled,
  onCellChange,
}: {
  batch: GradeBatch;
  scores: ScoresMap;
  disabled: boolean;
  onCellChange: (studentId: string, componentId: string, value: string) => void;
}) {
  const components = useMemo(
    () =>
      batch.breakdown.components
        .slice()
        .sort((a, b) => a.order_index - b.order_index),
    [batch.breakdown.components],
  );
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] border-collapse text-[13px]">
        <thead className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
          <tr>
            <th className="px-3 py-2 text-left">Student</th>
            {components.map((c) => (
              <th key={c.id} className="px-3 py-2 text-right">
                {c.name}
                <span className="ml-1 text-[10px] font-normal text-[#5a5a5a]">
                  /{c.max_score}
                </span>
              </th>
            ))}
            <th className="px-3 py-2 text-center">Done</th>
          </tr>
        </thead>
        <tbody>
          {batch.rows.map((row) => (
            <tr
              key={row.student_id}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-3 py-2">
                <div className="font-semibold text-[#1f2f40]">{row.full_name}</div>
                <div className="flex items-center gap-2 text-[11px] text-[#5a5a5a]">
                  <span className="font-mono">{row.student_number}</span>
                  {row.is_added_via_drop ? (
                    <span className="rounded-full bg-[#fff3d4] px-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a5a00]">
                      add/drop
                    </span>
                  ) : null}
                </div>
              </td>
              {components.map((c) => (
                <td key={c.id} className="px-2 py-1.5 text-right">
                  <input
                    value={scores[row.student_id]?.[c.id] ?? ""}
                    onChange={(e) =>
                      onCellChange(row.student_id, c.id, e.target.value)
                    }
                    placeholder="—"
                    inputMode="decimal"
                    disabled={disabled}
                    className="h-[32px] w-[88px] rounded-md border border-[#9bb0cc] bg-white px-2 text-right text-[13px] outline-none focus:border-[#2f76b7] disabled:bg-[#f1f3f5] disabled:opacity-80"
                  />
                </td>
              ))}
              <td className="px-3 py-2 text-center">
                {row.is_complete ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ecf8ef] text-[12px] font-bold text-[#1f7a3a]">
                    ✓
                  </span>
                ) : (
                  <span className="text-[11px] text-[#a31a1a]">missing</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
