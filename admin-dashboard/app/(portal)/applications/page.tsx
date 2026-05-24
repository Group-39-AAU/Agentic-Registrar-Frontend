"use client";

import { JsonResult, RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AppRow = {
  id?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_email?: string;
  admission_number?: string;
  sponsorship_type?: string;
  stream?: string;
  current_status?: string;
  payment_status?: string;
  updated_at?: string;
};

type AdmissionTerm = {
  id: string;
  term_name: string;
};

/** Sent as optional `status` query param to GET /undergraduate/applications. */
const STATUS_QUERY_VALUES = [
  "SUBMITTED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "UNDER_VERIFICATION",
  "AI_PRE_SCREENING",
  "UAT_PENDING",
  "UAT_COMPLETED",
  "FLAGGED_FOR_REVIEW",
  "CHANGES_REQUESTED",
  "PENDING_REVIEW",
  "DECIDED",
  "ENROLLED",
] as const;

type StatusFilter = "" | (typeof STATUS_QUERY_VALUES)[number];

const STATUS_FILTER_LABELS: Record<(typeof STATUS_QUERY_VALUES)[number], string> = {
  SUBMITTED: "Submitted",
  PAYMENT_PENDING: "Payment pending",
  PAYMENT_VERIFIED: "Payment completed",
  UNDER_VERIFICATION: "Under verification",
  AI_PRE_SCREENING: "AI pre-screening",
  UAT_PENDING: "UAT pending",
  UAT_COMPLETED: "UAT completed",
  FLAGGED_FOR_REVIEW: "Flagged for review",
  CHANGES_REQUESTED: "Changes requested",
  PENDING_REVIEW: "Pending review",
  DECIDED: "Decided",
  ENROLLED: "Enrolled",
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

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<RequestState>(initialState);
  const [terms, setTerms] = useState<AdmissionTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState("");
  const [termsLoading, setTermsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

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
          : data &&
              typeof data === "object" &&
              Array.isArray((data as { items?: unknown[] }).items)
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

  useEffect(() => {
    if (!selectedTermId) {
      return;
    }
    const params = new URLSearchParams({ term_id: selectedTermId });
    if (statusFilter) params.set("status", statusFilter);
    callApi(
      setApplications,
      `/api/v1/undergraduate/applications?${params.toString()}`,
      "GET",
    );
  }, [selectedTermId, statusFilter]);

  const rows = useMemo(() => {
    if (Array.isArray(applications.data)) return applications.data as AppRow[];
    if (
      applications.data &&
      typeof applications.data === "object" &&
      Array.isArray((applications.data as { items?: unknown[] }).items)
    ) {
      return (applications.data as { items: AppRow[] }).items;
    }
    return [];
  }, [applications.data]);

  return (
    <Section
      title="Applications"
      subtitle="Undergraduate applications list (auto-loaded)"
    >
      <div className="mb-3 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="term-select" className="text-[12px] font-semibold text-[#3a3a3a]">
            Admission term
          </label>
          <select
            id="term-select"
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
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-[12px] font-semibold text-[#3a3a3a]">
            Application status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-[36px] min-w-[220px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] text-[#1a1a1a] outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_QUERY_VALUES.map((v) => (
              <option key={v} value={v}>
                {STATUS_FILTER_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-3 text-[13px] text-[#5a5a5a]">
        Total records: <span className="font-semibold text-[#2f76b7]">{rows.length}</span>
        {statusFilter ? (
          <>
            {" "}
            · Status:{" "}
            <span className="font-semibold text-[#2f76b7]">
              {STATUS_FILTER_LABELS[statusFilter as (typeof STATUS_QUERY_VALUES)[number]]}
            </span>
          </>
        ) : null}
      </p>

      {applications.loading ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading applications…</p>
      ) : applications.error ? (
        <JsonResult state={applications} />
      ) : (
        <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Admission #</th>
                <th className="px-4 py-3">Stream</th>
                <th className="px-4 py-3">Sponsorship</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#5a5a5a]">
                    No applications found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const name = `${row.applicant_first_name ?? ""} ${row.applicant_last_name ?? ""}`.trim();
                  return (
                    <tr
                      key={String(row.id ?? row.admission_number ?? index)}
                      role={row.id ? "link" : undefined}
                      tabIndex={row.id ? 0 : -1}
                      className={`border-b border-gray-100 ${row.id ? "cursor-pointer hover:bg-[#eef4ff]/70" : ""}`}
                      onClick={() => {
                        if (row.id) router.push(`/applications/${row.id}`);
                      }}
                      onKeyDown={(e) => {
                        if (!row.id) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(`/applications/${row.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="text-[12.5px] font-semibold text-[#1f2f40]">{name || "—"}</div>
                        {row.applicant_email ? (
                          <div className="text-[11px] text-[#5a5a5a]">{row.applicant_email}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#2f76b7]">{row.admission_number ?? "—"}</td>
                      <td className="px-4 py-3">{row.stream ?? "—"}</td>
                      <td className="px-4 py-3">{row.sponsorship_type ?? "—"}</td>
                      <td className="px-4 py-3">{row.current_status ?? "—"}</td>
                      <td className="px-4 py-3">{row.payment_status ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                        {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
