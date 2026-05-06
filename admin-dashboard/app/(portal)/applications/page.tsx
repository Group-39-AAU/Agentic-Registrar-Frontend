"use client";

import { JsonResult, RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type AppRow = {
  id?: string;
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
    const query = `?term_id=${encodeURIComponent(selectedTermId)}`;
    callApi(setApplications, `/api/v1/undergraduate/applications${query}`, "GET");
  }, [selectedTermId]);

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
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#5a5a5a]">
          Select term:
        </p>
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

      <p className="mb-3 text-[13px] text-[#5a5a5a]">
        Total records: <span className="font-semibold text-[#2f76b7]">{rows.length}</span>
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
                <th className="px-4 py-3">Admission #</th>
                <th className="px-4 py-3">Stream</th>
                <th className="px-4 py-3">Sponsorship</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">ID</th>
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
                rows.map((row, index) => (
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
                    <td className="px-4 py-3 font-mono text-[#2f76b7]">{row.admission_number ?? "—"}</td>
                    <td className="px-4 py-3">{row.stream ?? "—"}</td>
                    <td className="px-4 py-3">{row.sponsorship_type ?? "—"}</td>
                    <td className="px-4 py-3">{row.current_status ?? "—"}</td>
                    <td className="px-4 py-3">{row.payment_status ?? "—"}</td>
                    <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-mono text-[11px] text-[#5a5a5a]" title={row.id}>
                      {row.id ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
