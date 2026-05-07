"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ProgramChoice = {
  id: string;
  code: string;
  name: string;
};

type ApplicationRecord = {
  id: string;
  applicant_id?: string;
  applicant_email?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  sponsorship_type: string;
  stream: string;
  admission_number: string;
  program_choice_1_id?: string;
  program_choice_2_id?: string;
  program_choice_3_id?: string;
  program_choice_1?: ProgramChoice;
  program_choice_2?: ProgramChoice;
  program_choice_3?: ProgramChoice;
  admission_term: string | { id: string; term_name: string };
  current_status: string;
  final_decision: string;
  payment_status: string;
  payment_reference?: string;
  remarks?: string;
  extra_data?: Record<string, unknown>;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
  uat_id?: string | null;
};

type UatResult = {
  uat_id: string;
  score: number;
  message: string;
};

function termText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybe = value as { term_name?: unknown; id?: unknown };
    if (typeof maybe.term_name === "string") return maybe.term_name;
    if (typeof maybe.id === "string") return maybe.id;
  }
  return "—";
}

function StatusBadge({ value, kind }: { value: string; kind: "status" | "payment" }) {
  const v = value?.toUpperCase() ?? "";
  const kindLabel = kind === "payment" ? "payment" : "status";
  let cls =
    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ";
  if (kind === "payment") {
    if (v.includes("PENDING")) cls += "bg-amber-100 text-amber-900 ring-1 ring-amber-200";
    else if (v.includes("PAID") || v.includes("COMPLETE"))
      cls += "bg-green-100 text-green-900 ring-1 ring-green-200";
    else cls += "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
  } else {
    if (v.includes("DRAFT")) cls += "bg-slate-100 text-slate-800 ring-1 ring-slate-200";
    else if (v.includes("SUBMIT") || v.includes("REVIEW"))
      cls += "bg-sky-100 text-sky-900 ring-1 ring-sky-200";
    else if (v.includes("APPROVE") || v.includes("ACCEPT"))
      cls += "bg-green-100 text-green-900 ring-1 ring-green-200";
    else if (v.includes("REJECT") || v.includes("DENY"))
      cls += "bg-red-100 text-red-900 ring-1 ring-red-200";
    else cls += "bg-[#eef4ff] text-[#2a66a7] ring-1 ring-[#c5d9f5]";
  }
  return (
    <span className={cls}>
      <span className="mr-1.5 rounded bg-black/10 px-1.5 py-0.5 text-[9px] font-semibold lowercase tracking-normal">
        {kindLabel}
      </span>
      <span>{value || "—"}</span>
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 sm:grid-cols-[200px_1fr] sm:gap-4 sm:py-3.5">
      <dt className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
        {label}
      </dt>
      <dd className="text-[14px] text-[#1a1a1a]">{children}</dd>
    </div>
  );
}

function IdLine({ id }: { id: string }) {
  return (
    <span className="break-all font-mono text-[12px] text-[#3a3a3a]" title={id}>
      {id}
    </span>
  );
}

function ProgramChoiceDisplay({
  program,
  fallbackId,
}: {
  program?: ProgramChoice | null;
  fallbackId: string;
}) {
  if (program) {
    return (
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[#1a1a1a]">{program.name}</p>
        <p className="text-[13px] text-[#3a3a3a]">
          <span className="font-mono font-semibold text-[#2f76b7]">{program.code}</span>
          <span className="text-[#5a5a5a]"> · {program.id}</span>
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-[13px] text-amber-800">Program could not be loaded.</p>
      <IdLine id={fallbackId} />
    </div>
  );
}

export default function AdminAdmissionDetailClient({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uatLoading, setUatLoading] = useState(false);
  const [uatError, setUatError] = useState<string | null>(null);
  const [uatResult, setUatResult] = useState<UatResult | null>(null);

  const handleCheckUat = async () => {
    if (!data?.uat_id) return;
    const token = localStorage.getItem("admin_dashboard_token");
    setUatError(null);
    setUatLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/testing-center/callback/${encodeURIComponent(data.uat_id)}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          payload && typeof payload === "object" && "detail" in payload
            ? String((payload as { detail?: unknown }).detail ?? "Could not fetch UAT result.")
            : "Could not fetch UAT result."
        );
      }
      setUatResult(payload as UatResult);
    } catch (e) {
      setUatError(e instanceof Error ? e.message : "Could not fetch UAT result.");
    } finally {
      setUatLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadApplication = async () => {
      await Promise.resolve();
      if (cancelled) return;

      const token = localStorage.getItem("admin_dashboard_token");
      if (!token?.trim()) {
        setLoading(false);
        setError("not_authenticated");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) throw new Error("session_expired");
          if (res.status === 404) throw new Error("not_found");
          throw new Error(
            payload && typeof payload === "object" && "detail" in payload
              ? String((payload as { detail?: unknown }).detail ?? "Could not load this application.")
              : "Could not load this application."
          );
        }
        const row =
          Array.isArray(payload) && payload.length > 0
            ? payload[0]
            : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
              ? (payload as { items: unknown[] }).items[0]
              : payload;
        if (!cancelled) setData(row as ApplicationRecord);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Could not load this application.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadApplication();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="mt-6 rounded-xl border border-gray-200 bg-white px-8 py-16 text-center text-[14px] text-[#5a5a5a] shadow-sm">
        Loading application…
      </div>
    );
  }

  if (error === "not_authenticated" || error === "session_expired") {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-8 py-10 text-center">
        <p className="text-[14px] text-[#5a5a5a]">
          {error === "session_expired"
            ? "Your session expired. Please log in again."
            : "Please log in to view this application."}
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("admin_dashboard_token");
            localStorage.removeItem("admin_dashboard_logged_in");
            router.push("/");
          }}
          className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#3f79b5] px-6 py-2.5 text-[14px] font-semibold text-white hover:bg-[#356e9f]"
        >
          Go to login
        </button>
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="mt-6 rounded-xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
        <p className="text-[16px] font-semibold text-[#1a1a1a]">Application not found</p>
        <p className="mt-2 text-[14px] text-[#5a5a5a]">
          It may have been removed or you don’t have access.
        </p>
        <Link
          href="/applications"
          className="mt-6 inline-block rounded-md bg-[#3f79b5] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#356e9f]"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-8 py-10 text-center text-[14px] text-red-800">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const extra =
    data.extra_data && Object.keys(data.extra_data).length > 0
      ? JSON.stringify(data.extra_data, null, 2)
      : null;

  return (
    <div className="mt-6 space-y-6">
      <p className="mb-1">
        <Link
          href="/applications"
          className="text-[13px] font-medium text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
        >
          ← Back to Applications
        </Link>
      </p>

      {data.is_deleted ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          This application is marked as deleted in the system.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#f0f6fc] to-white px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
            Undergraduate application
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-[28px] font-bold tracking-tight text-[#1a1a1a]">
              Admission № <span className="font-mono text-[#2f76b7]">{data.admission_number}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={data.current_status} kind="status" />
              <StatusBadge value={data.payment_status} kind="payment" />
            </div>
          </div>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">{termText(data.admission_term)}</p>
        </div>

        <dl className="px-8 pb-2 pt-2">
          {(() => {
            const applicantName = [data.applicant_first_name, data.applicant_last_name]
              .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
              .join(" ")
              .trim();
            return applicantName ? (
              <DetailRow label="Applicant">{applicantName}</DetailRow>
            ) : null;
          })()}
          {data.applicant_email ? (
            <DetailRow label="Email">
              <a
                href={`mailto:${data.applicant_email}`}
                className="text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
              >
                {data.applicant_email}
              </a>
            </DetailRow>
          ) : null}
          <DetailRow label="Admission term">{termText(data.admission_term)}</DetailRow>
          <DetailRow label="Sponsorship">{data.sponsorship_type}</DetailRow>
          <DetailRow label="Stream">{data.stream}</DetailRow>
          <DetailRow label="Final decision">
            {data.final_decision && data.final_decision !== "string" ? data.final_decision : "—"}
          </DetailRow>
          <DetailRow label="Remarks">
            {data.remarks && data.remarks !== "string" ? data.remarks : "—"}
          </DetailRow>
        </dl>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <h2 className="text-[15px] font-bold text-[#2a66a7]">Program choices</h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">
            First, second, and third preferences from the submitted application.
          </p>
        </div>
        <dl className="px-8 pb-4">
          <DetailRow label="1st choice">
            <ProgramChoiceDisplay
              program={data.program_choice_1}
              fallbackId={data.program_choice_1?.id ?? data.program_choice_1_id ?? "—"}
            />
          </DetailRow>
          <DetailRow label="2nd choice">
            <ProgramChoiceDisplay
              program={data.program_choice_2}
              fallbackId={data.program_choice_2?.id ?? data.program_choice_2_id ?? "—"}
            />
          </DetailRow>
          <DetailRow label="3rd choice">
            <ProgramChoiceDisplay
              program={data.program_choice_3}
              fallbackId={data.program_choice_3?.id ?? data.program_choice_3_id ?? "—"}
            />
          </DetailRow>
        </dl>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#2a66a7]">UAT result</h2>
            <p className="mt-1 text-[12px] text-[#5a5a5a]">
              Look up the testing center result tied to this application.
            </p>
          </div>
          {data.uat_id ? (
            <button
              type="button"
              onClick={handleCheckUat}
              disabled={uatLoading}
              className="h-[36px] rounded-md bg-[#3f79b5] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#356e9f] disabled:opacity-60"
            >
              {uatLoading ? "Checking…" : uatResult ? "Refresh result" : "Check result"}
            </button>
          ) : null}
        </div>
        <div className="px-8 py-4">
        
          {uatError ? (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800" role="alert">
              {uatError}
            </div>
          ) : null}
          {uatResult ? (
            <>
              <DetailRow label="Score">
                <span className="font-mono text-[14px] font-semibold text-[#1a1a1a]">
                  {uatResult.score}
                </span>
              </DetailRow>
              <DetailRow label="Message">
                <span className="text-[14px] text-[#1a1a1a]">{uatResult.message}</span>
              </DetailRow>
            </>
          ) : !data.uat_id ? (
            <p className="mt-2 text-[13px] text-[#5a5a5a]">
            The Applicant has not taken the UAT test yet.
          </p>
          ) : null}
        </div>
      </div>

      {extra ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
            <h2 className="text-[15px] font-bold text-[#2a66a7]">Extra data</h2>
          </div>
          <pre className="max-h-[320px] overflow-auto px-8 py-4 font-mono text-[11px] leading-relaxed text-[#3a3a3a]">
            {extra}
          </pre>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-6 rounded-xl border border-gray-100 bg-white px-8 py-5 text-[12px] text-[#5a5a5a] shadow-sm">
        <div>
          <span className="font-semibold text-[#3a3a3a]">Created</span>
          <br />
          {data.created_at
            ? new Date(data.created_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </div>
        <div>
          <span className="font-semibold text-[#3a3a3a]">Last updated</span>
          <br />
          {data.updated_at
            ? new Date(data.updated_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—"}
        </div>
      </div>
    </div>
  );
}
