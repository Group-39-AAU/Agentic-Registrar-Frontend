"use client";

import { RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import Pagination from "@/components/Pagination";
import { useCallback, useEffect, useMemo, useState } from "react";

/** Matches GET /api/v1/undergraduate/enrollment/list/all paginated body */
type EnrollmentRow = {
  id?: string;
  application_id?: string;
  applicant_id?: string;
  student_full_name?: string;
  admission_term_id?: string;
  university_id?: string;
  program_id?: string;
  department?: string;
  enrollment_term?: string;
  created_at?: string;
};

type EnrollmentListPayload = {
  items: EnrollmentRow[];
  total: number;
  page: number;
  page_size: number;
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [hasListed, setHasListed] = useState(false);

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

  const fetchEnrollmentList = useCallback(
    (targetPage: number, targetPageSize: number) => {
      if (!selectedTermId) return;
      const params = new URLSearchParams({
        term_id: selectedTermId,
        page: String(targetPage),
        page_size: String(targetPageSize),
      });
      callApi(
        setListResult,
        `/api/v1/undergraduate/enrollment/list/all?${params.toString()}`,
        "GET",
      );
    },
    [selectedTermId],
  );

  // Reset to page 1 when the term or page size changes. Refetch only
  // if the user has already opened the list (avoids a stray request
  // before they click "List Enrollments").
  useEffect(() => {
    setPage(1);
  }, [selectedTermId, pageSize]);

  useEffect(() => {
    if (!hasListed || !selectedTermId) return;
    fetchEnrollmentList(page, pageSize);
  }, [hasListed, page, pageSize, selectedTermId, fetchEnrollmentList]);

  const enrollmentList = useMemo((): EnrollmentListPayload => {
    const data = listResult.data;
    if (!data || typeof data !== "object") {
      return { items: [], total: 0, page: 0, page_size: 0 };
    }
    const obj = data as Record<string, unknown>;
    const items: EnrollmentRow[] = Array.isArray(obj.items)
      ? (obj.items as EnrollmentRow[])
      : Array.isArray(data)
        ? (data as EnrollmentRow[])
        : [];
    const total = typeof obj.total === "number" ? obj.total : items.length;
    const page = typeof obj.page === "number" ? obj.page : 0;
    const page_size = typeof obj.page_size === "number" ? obj.page_size : 0;
    return { items, total, page, page_size };
  }, [listResult.data]);

  const enrollments = enrollmentList.items;

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
          className="aau-button-primary inline-flex h-[38px] items-center rounded-md px-4 text-[13px] font-semibold tracking-wide text-white"
        >
          Run Final Enrollment
        </button>
        <button
          type="button"
          disabled={!selectedTermId}
          onClick={() => {
            setHasListed(true);
            setPage(1);
            fetchEnrollmentList(1, pageSize);
          }}
          className="aau-button-secondary inline-flex h-[38px] items-center rounded-md px-4 text-[13px] font-semibold tracking-wide text-[#2f76b7] disabled:opacity-60"
        >
          List Enrollments
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Run Result</p>
          {runResult.loading ? (
            <p className="text-[13px] text-[#5a5a5a]">Running final enrollment…</p>
          ) : runResult.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {runResult.error}
            </p>
          ) : runResult.data ? (
            <p className="text-[13px] font-semibold text-green-700">
              {runResult.data && typeof runResult.data === "object" && "message" in runResult.data
                ? String((runResult.data as { message?: unknown }).message ?? "Final enrollment ran successfully.")
                : "Final enrollment ran successfully."}
            </p>
          ) : null}
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
            <div className="space-y-2">
              {listResult.data && typeof listResult.data === "object" && "items" in (listResult.data as object) ? (
                <p className="text-[12px] text-[#5a5a5a]">
                  Total: <span className="font-semibold text-[#2f76b7]">{enrollmentList.total}</span>
                  {" · "}
                  Page <span className="font-semibold text-[#2f76b7]">{enrollmentList.page}</span>
                  {" · "}
                  Page size <span className="font-semibold text-[#2f76b7]">{enrollmentList.page_size}</span>
                </p>
              ) : null}
              <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
                No enrollments found yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] text-[#5a5a5a]">
                Total: <span className="font-semibold text-[#2f76b7]">{enrollmentList.total}</span>
              </p>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[1400px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                      <th className="px-4 py-3">Enrollment ID</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Enrollment term</th>
                      <th className="px-4 py-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((row, index) => (
                      <tr
                        key={String(row.id ?? row.application_id ?? index)}
                        className="border-b border-gray-100"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] font-semibold text-[#2f76b7]">
                          {row.university_id ?? "—"}
                        </td>
                        <td className="max-w-[220px] px-4 py-3 font-medium text-[#1a1a1a]">
                          {row.student_full_name ?? "—"}
                        </td>
                        <td className="max-w-[180px] px-4 py-3">{row.department ?? "—"}</td>
                        <td className="px-4 py-3">{row.enrollment_term ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#5a5a5a]">
                          {row.created_at
                            ? new Date(row.created_at).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={enrollmentList.total}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="enrollments"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
