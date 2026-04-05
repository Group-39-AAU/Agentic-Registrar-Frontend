"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  clearStoredAccessToken,
  fetchProgramById,
  fetchUndergraduateApplicationById,
  getStoredAccessToken,
  type ProgramItem,
  type UndergraduateApplicationRecord,
} from "@/lib/api";

function StatusBadge({ value, kind }: { value: string; kind: "status" | "payment" }) {
  const v = value?.toUpperCase() ?? "";
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
  return <span className={cls}>{value || "—"}</span>;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
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
  program: ProgramItem | null;
  fallbackId: string;
}) {
  if (program) {
    return (
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-[#1a1a1a]">{program.name}</p>
        <p className="text-[13px] text-[#3a3a3a]">
          <span className="font-mono font-semibold text-[#2f76b7]">{program.code}</span>
          <span className="text-[#5a5a5a]"> · </span>
          {program.department}
        </p>
        <p className="text-[11px] uppercase tracking-wide text-[#5a5a5a]">
          Stream: {program.stream}
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

export default function AdmissionDetailClient({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<UndergraduateApplicationRecord | null>(null);
  const [programs, setPrograms] = useState<{
    c1: ProgramItem | null;
    c2: ProgramItem | null;
    c3: ProgramItem | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      setLoading(false);
      setError("not_authenticated");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPrograms(null);
      try {
        const row = await fetchUndergraduateApplicationById(applicationId);
        const ids = [
          row.program_choice_1_id,
          row.program_choice_2_id,
          row.program_choice_3_id,
        ];
        const loaded = await Promise.all(
          ids.map((id) => fetchProgramById(id).catch((): null => null))
        );
        if (!cancelled) {
          setData(row);
          setPrograms({
            c1: loaded[0],
            c2: loaded[1],
            c3: loaded[2],
          });
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            setError("session_expired");
          } else if (e instanceof ApiError && e.status === 404) {
            setError("not_found");
          } else {
            setError(
              e instanceof ApiError ? e.message : "Could not load this application."
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white px-8 py-16 text-center text-[14px] text-[#5a5a5a] shadow-sm">
        Loading application…
      </div>
    );
  }

  if (error === "not_authenticated" || error === "session_expired") {
    return (
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-8 py-10 text-center">
        <p className="text-[14px] text-[#5a5a5a]">
          {error === "session_expired"
            ? "Your session expired. Please log in again."
            : "Please log in to view this application."}
        </p>
        <button
          type="button"
          onClick={() => {
            clearStoredAccessToken();
            router.push("/admissions/login");
          }}
          className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#3f79b5] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#356e9f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f79b5] focus-visible:ring-offset-2"
        >
          Go to login
        </button>
      </div>
    );
  }

  if (error === "not_found") {
    return (
      <div className="mt-8 rounded-xl border border-gray-200 bg-white px-8 py-12 text-center shadow-sm">
        <p className="text-[16px] font-semibold text-[#1a1a1a]">Application not found</p>
        <p className="mt-2 text-[14px] text-[#5a5a5a]">
          It may have been removed or you don’t have access.
        </p>
        <Link
          href="/admissions/my-admissions"
          className="mt-6 inline-block rounded-md bg-[#3f79b5] px-6 py-2 text-[14px] font-semibold text-white hover:bg-[#356e9f]"
        >
          Back to My admissions
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-8 py-10 text-center text-[14px] text-red-800">
        {error}
      </div>
    );
  }

  if (!data || !programs) return null;

  const extra =
    data.extra_data && Object.keys(data.extra_data).length > 0
      ? JSON.stringify(data.extra_data, null, 2)
      : null;

  return (
    <div className="mt-6 space-y-6">
      {data.is_deleted ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900"
        >
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
              Admission №{" "}
              <span className="font-mono text-[#2f76b7]">{data.admission_number}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={data.current_status} kind="status" />
              <StatusBadge value={data.payment_status} kind="payment" />
            </div>
          </div>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">{data.admission_term}</p>
        </div>

        <dl className="px-8 pb-2 pt-2">
          <DetailRow label="Application ID">
            <IdLine id={data.id} />
          </DetailRow>
          <DetailRow label="Applicant ID">
            <IdLine id={data.applicant_id} />
          </DetailRow>
          <DetailRow label="Sponsorship">{data.sponsorship_type}</DetailRow>
          <DetailRow label="Stream">{data.stream}</DetailRow>
          <DetailRow label="Final decision">
            {data.final_decision && data.final_decision !== "string"
              ? data.final_decision
              : "—"}
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
            First, second, and third preferences (loaded from the programs catalog).
          </p>
        </div>
        <dl className="px-8 pb-4">
          <DetailRow label="1st choice">
            <ProgramChoiceDisplay
              program={programs.c1}
              fallbackId={data.program_choice_1_id}
            />
          </DetailRow>
          <DetailRow label="2nd choice">
            <ProgramChoiceDisplay
              program={programs.c2}
              fallbackId={data.program_choice_2_id}
            />
          </DetailRow>
          <DetailRow label="3rd choice">
            <ProgramChoiceDisplay
              program={programs.c3}
              fallbackId={data.program_choice_3_id}
            />
          </DetailRow>
        </dl>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <h2 className="text-[15px] font-bold text-[#2a66a7]">Payment</h2>
        </div>
        <dl className="px-8 pb-4">
          <DetailRow label="Payment reference">
            {data.payment_reference && data.payment_reference !== "string"
              ? data.payment_reference
              : "—"}
          </DetailRow>
        </dl>
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
