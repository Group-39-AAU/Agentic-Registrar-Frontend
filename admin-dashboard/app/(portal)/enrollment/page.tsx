"use client";

import { JsonResult, RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import { useEffect, useMemo, useState } from "react";

type EnrollmentRow = {
  id?: string;
  application_id?: string;
  student_id?: string;
  program_name?: string;
  enrollment_status?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

type AdmissionTerm = {
  id: string;
  term_name: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function toTermText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybe = value as { term_name?: unknown; id?: unknown };
    if (typeof maybe.term_name === "string") return maybe.term_name;
    if (typeof maybe.id === "string") return maybe.id;
  }
  return "";
}

export default function EnrollmentPage() {
  const [runResult, setRunResult] = useState<RequestState>(initialState);
  const [listResult, setListResult] = useState<RequestState>(initialState);
  const [terms, setTerms] = useState<AdmissionTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [selectedTermId, setSelectedTermId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTermsLoading(true);
      try {
        const token = localStorage.getItem("admin_dashboard_token") ?? "";
        const headers: Record<string, string> = {};
        if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
        const res = await fetch(`${API_BASE}/api/v1/undergraduate/admission-terms/open`, {
          headers,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error("Could not load admission terms.");

        const rows = Array.isArray(data)
          ? data
          : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
            ? (data as { items: unknown[] }).items
            : [];

        const normalized = rows
          .map((row) => {
            if (!row || typeof row !== "object") return null;
            const r = row as Record<string, unknown>;
            const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
            const label = toTermText(r.term_name);
            if (!id || !label) return null;
            return { id, term_name: label } satisfies AdmissionTerm;
          })
          .filter((t): t is AdmissionTerm => t !== null);

        if (!cancelled) {
          setTerms(normalized);
          setSelectedTermId((prev) => prev || (normalized[0]?.id ?? ""));
        }
      } catch {
        if (!cancelled) setTerms([]);
      } finally {
        if (!cancelled) setTermsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const enrollments = useMemo(() => {
    const data = listResult.data;
    if (Array.isArray(data)) return data as EnrollmentRow[];
    if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
      return (data as { items: EnrollmentRow[] }).items;
    }
    return [];
  }, [listResult.data]);

  return (
    <Section
      title="Enrollment"
      subtitle="Select admission term first, then run and list enrollments for that term"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#5a5a5a]">Admission term:</p>
        <select
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
          disabled={termsLoading || terms.length === 0}
          className="h-[36px] min-w-[280px] rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none disabled:opacity-60"
        >
          {terms.length === 0 ? (
            <option value="">
              {termsLoading ? "Loading admission terms..." : "No admission terms available"}
            </option>
          ) : null}
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.term_name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!selectedTermId}
          onClick={() =>
            callApi(
              setRunResult,
              `/api/v1/undergraduate/enrollment/run?term_id=${encodeURIComponent(selectedTermId)}`,
              "POST"
            )
          }
          className="h-[36px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
        >
          Run Final Enrollment
        </button>
        <button
          type="button"
          disabled={!selectedTermId}
          onClick={() =>
            callApi(
              setListResult,
              `/api/v1/undergraduate/enrollment/list/all?term_id=${encodeURIComponent(selectedTermId)}`,
              "GET"
            )
          }
          className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[13px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
        >
          List Enrollments
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Run Result</p>
          <JsonResult state={runResult} />
        </div>
        <div>
          <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Enrollment List</p>
          {listResult.loading ? (
            <p className="text-[13px] text-[#5a5a5a]">Loading enrollments…</p>
          ) : listResult.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {listResult.error}
            </p>
          ) : listResult.data === null ? (
            <p className="text-[12px] text-[#5a5a5a]">
              Click <span className="font-semibold">List Enrollments</span> to view records.
            </p>
          ) : enrollments.length === 0 ? (
            <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
              No enrollments found yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                    <th className="px-4 py-3">Enrollment ID</th>
                    <th className="px-4 py-3">Application ID</th>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((row, index) => (
                    <tr key={String(row.id ?? row.application_id ?? index)} className="border-b border-gray-100">
                      <td className="max-w-[180px] truncate px-4 py-3 font-mono text-[11px] text-[#2f76b7]" title={row.id}>
                        {row.id ?? "—"}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 font-mono text-[11px] text-[#5a5a5a]" title={row.application_id}>
                        {row.application_id ?? "—"}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 font-mono text-[11px] text-[#5a5a5a]" title={row.student_id}>
                        {row.student_id ?? "—"}
                      </td>
                      <td className="px-4 py-3">{row.program_name ?? "—"}</td>
                      <td className="px-4 py-3">{row.enrollment_status ?? row.status ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                        {row.updated_at || row.created_at
                          ? new Date(row.updated_at ?? row.created_at ?? "").toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
