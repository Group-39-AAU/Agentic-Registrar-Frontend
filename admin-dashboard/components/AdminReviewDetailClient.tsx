"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ReviewDetail = {
  application_id?: string;
  student_name?: string;
  admission_number?: string;
  sponsorship_type?: string;
  stream?: string;
  grade12_score?: number;
  uat_score?: number;
  final_score?: number;
  rank_position?: number;
  assigned_program_name?: string;
  assigned_program_code?: string;
  assigned_stream?: string;
  is_assigned?: boolean;
  assignment_detail?: string;
  program_choice_1?: string;
  program_choice_2?: string;
  program_choice_3?: string;
  ai_recommended_decision?: string;
  ai_confidence?: number;
  current_status?: string;
  has_decision?: boolean;
};

type DecisionValue = "APPROVED" | "REJECTED";

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
        {label}
      </dt>
      <dd className="text-[14px] text-[#1a1a1a]">{children}</dd>
    </div>
  );
}

function StatusPill({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
}) {
  const palette: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-800 ring-1 ring-slate-200",
    info: "bg-sky-100 text-sky-900 ring-1 ring-sky-200",
    success: "bg-green-100 text-green-900 ring-1 ring-green-200",
    warn: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
    danger: "bg-red-100 text-red-900 ring-1 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${palette[tone]}`}
    >
      {value || "—"}
    </span>
  );
}

function statusTone(value: string | undefined): "neutral" | "info" | "success" | "warn" | "danger" {
  const v = (value ?? "").toUpperCase();
  if (!v) return "neutral";
  if (v.includes("APPROVE") || v.includes("ACCEPT") || v.includes("PAID") || v.includes("COMPLETE"))
    return "success";
  if (v.includes("REJECT") || v.includes("DENY") || v.includes("FAIL")) return "danger";
  if (v.includes("PENDING") || v.includes("DRAFT")) return "warn";
  if (v.includes("REVIEW") || v.includes("SUBMIT")) return "info";
  return "neutral";
}

export default function AdminReviewDetailClient({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReviewDetail | null>(null);

  const [decision, setDecision] = useState<DecisionValue>("APPROVED");
  const [remarks, setRemarks] = useState<string>("");
  const [decideLoading, setDecideLoading] = useState(false);
  const [decideError, setDecideError] = useState<string | null>(null);
  const [decideSuccess, setDecideSuccess] = useState<string | null>(null);

  const fetchDetail = async (signal?: AbortSignal): Promise<ReviewDetail | null> => {
    const token = localStorage.getItem("admin_dashboard_token") ?? "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
    const res = await fetch(
      `${API_BASE}/api/v1/undergraduate/review/students/${encodeURIComponent(applicationId)}`,
      { headers, signal }
    );
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail?: unknown }).detail ?? "Could not load review detail.")
          : "Could not load review detail."
      );
    }
    const row =
      Array.isArray(payload) && payload.length > 0
        ? payload[0]
        : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
          ? (payload as { items: unknown[] }).items[0]
          : payload;
    return row as ReviewDetail;
  };

  const reloadDetail = async () => {
    try {
      const row = await fetchDetail();
      setData(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load review detail.");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = await fetchDetail(controller.signal);
        if (!cancelled) setData(row);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load review detail.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleDecide = async () => {
    if (!applicationId) return;
    setDecideError(null);
    setDecideSuccess(null);
    setDecideLoading(true);
    try {
      const token = localStorage.getItem("admin_dashboard_token") ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
      const res = await fetch(
        `${API_BASE}/api/v1/undergraduate/review/decide/${encodeURIComponent(applicationId)}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            human_decision: decision,
            justification_remarks:
              remarks.trim() || "Decided by admissions officer via admin dashboard.",
          }),
        }
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          payload && typeof payload === "object" && "detail" in payload
            ? String((payload as { detail?: unknown }).detail ?? "Decision failed.")
            : "Decision failed."
        );
      }
      setDecideSuccess(`Decision recorded: ${decision}.`);
      await reloadDetail();
    } catch (e) {
      setDecideError(e instanceof Error ? e.message : "Decision failed.");
    } finally {
      setDecideLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p>
        <Link
          href="/review"
          className="text-[13px] font-medium text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
        >
          ← Back to Review Queue
        </Link>
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
            Student review card
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-[#1a1a1a]">
                {data?.student_name ?? "Applicant"}
              </h1>
              <p className="mt-1 text-[12px] text-[#5a5a5a]">
                Admission №{" "}
                <span className="font-mono text-[#2f76b7]">
                  {data?.admission_number ?? "—"}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {data?.current_status ? (
                <StatusPill value={data.current_status} tone={statusTone(data.current_status)} />
              ) : null}
              {data?.has_decision ? (
                <StatusPill value="decision: recorded" tone="success" />
              ) : null}
            </div>
          </div>
        </div>

        {loading ? (
          <p className="px-8 py-6 text-[13px] text-[#5a5a5a]">Loading detail…</p>
        ) : error ? (
          <p className="mx-8 my-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        ) : data ? (
          <dl className="px-8 pb-2 pt-2">
            <DetailRow label="Sponsorship">{data.sponsorship_type ?? "—"}</DetailRow>
            <DetailRow label="Stream">{data.stream ?? "—"}</DetailRow>
            <DetailRow label="Rank position">{data.rank_position ?? "—"}</DetailRow>
            <DetailRow label="Final score">
              {typeof data.final_score === "number" ? data.final_score : "—"}
            </DetailRow>
            <DetailRow label="Grade 12 score">
              {typeof data.grade12_score === "number" ? data.grade12_score : "—"}
            </DetailRow>
            <DetailRow label="UAT score">
              {typeof data.uat_score === "number" ? data.uat_score : "—"}
            </DetailRow>

            <DetailRow label="Assignment">
              {data.is_assigned ? (
                <span className="text-green-700">
                  Assigned
                  {data.assigned_program_name ? ` · ${data.assigned_program_name}` : ""}
                  {data.assigned_program_code ? ` (${data.assigned_program_code})` : ""}
                  {data.assigned_stream ? ` · ${data.assigned_stream}` : ""}
                </span>
              ) : (
                <span className="text-[#5a5a5a]">Not assigned</span>
              )}
            </DetailRow>
            {data.assignment_detail && data.assignment_detail !== "string" ? (
              <DetailRow label="Assignment detail">{data.assignment_detail}</DetailRow>
            ) : null}

            <DetailRow label="1st choice">{data.program_choice_1 ?? "—"}</DetailRow>
            <DetailRow label="2nd choice">{data.program_choice_2 ?? "—"}</DetailRow>
            <DetailRow label="3rd choice">{data.program_choice_3 ?? "—"}</DetailRow>

            <DetailRow label="AI recommendation">
              {data.ai_recommended_decision ? (
                <StatusPill
                  value={data.ai_recommended_decision}
                  tone={statusTone(data.ai_recommended_decision)}
                />
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="AI confidence">
              {typeof data.ai_confidence === "number" ? data.ai_confidence : "—"}
            </DetailRow>
          </dl>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <h2 className="text-[15px] font-bold text-[#2a66a7]">Make decision</h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">
            Submit a decision for this single applicant. The status above will refresh once recorded.
          </p>
        </div>
        <div className="space-y-4 px-8 py-5">
          <div>
            <label
              htmlFor="decision-select"
              className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]"
            >
              Decision
            </label>
            <select
              id="decision-select"
              value={decision}
              onChange={(e) => setDecision(e.target.value as DecisionValue)}
              className="h-[36px] w-full max-w-[260px] rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none"
            >
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="decision-remarks"
              className="mb-1.5 block text-[12px] font-semibold text-[#3a3a3a]"
            >
              Justification remarks
            </label>
            <textarea
              id="decision-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              placeholder="Optional notes for the audit trail"
              className="w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 py-2 text-[13px] outline-none"
            />
          </div>

          {decideError ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
            >
              {decideError}
            </p>
          ) : null}
          {decideSuccess ? (
            <p className="text-[13px] font-semibold text-green-700">{decideSuccess}</p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDecide}
              disabled={decideLoading}
              className="h-[38px] min-w-[120px] rounded-md bg-[#3f79b5] px-5 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
            >
              {decideLoading ? "Deciding…" : "Decide"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
