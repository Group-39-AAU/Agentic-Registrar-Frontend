"use client";

import { JsonResult, RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import Pagination from "@/components/Pagination";
import { useEffect, useMemo, useState } from "react";

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

export default function RankingPage() {
  const [category, setCategory] = useState("ALL");
  const [terms, setTerms] = useState<AdmissionTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [selectedRunTermId, setSelectedRunTermId] = useState("");
  const [selectedSummaryTermId, setSelectedSummaryTermId] = useState("");
  const [selectedResultsTermId, setSelectedResultsTermId] = useState("");
  const [rankingRun, setRankingRun] = useState<RequestState>(initialState);
  const [summary, setSummary] = useState<RequestState>(initialState);
  const [results, setResults] = useState<RequestState>(initialState);
  // Client-side pagination for the ranking results tables. The backend
  // returns the full list per term; we slice locally. Three independent
  // page indices — one per table that can be visible.
  const [govPage, setGovPage] = useState(1);
  const [selfPage, setSelfPage] = useState(1);
  const [singlePage, setSinglePage] = useState(1);
  const [resultsPageSize, setResultsPageSize] = useState(25);

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
          .filter((x): x is AdmissionTerm => x !== null);

        if (!cancelled) {
          setTerms(normalized);
          setSelectedRunTermId((prev) =>
            prev || (normalized.length > 0 ? normalized[0].id : "")
          );
          setSelectedSummaryTermId((prev) =>
            prev || (normalized.length > 0 ? normalized[0].id : "")
          );
          setSelectedResultsTermId((prev) =>
            prev || (normalized.length > 0 ? normalized[0].id : "")
          );
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

  const summaryData = useMemo(() => {
    return summary.data && typeof summary.data === "object"
      ? (summary.data as {
          term_id?: string;
          total_assigned?: number;
          total_unassigned?: number;
          program_cutoffs?: Array<{
            program_id?: string;
            program_code?: string;
            program_name?: string;
            stream?: string;
            max_capacity?: number;
            assigned_count?: number;
            cutoff_score?: number;
          }>;
          stream_cutoffs?: Array<{
            stream?: string;
            max_capacity?: number;
            assigned_count?: number;
            cutoff_score?: number;
          }>;
        })
      : null;
  }, [summary.data]);

  const resultRows = useMemo(() => {
    const data = results.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)) {
      return (data as { items: unknown[] }).items;
    }
    return [];
  }, [results.data]);

  const selectedSummaryTermName = useMemo(
    () => terms.find((t) => t.id === selectedSummaryTermId)?.term_name ?? selectedSummaryTermId,
    [terms, selectedSummaryTermId]
  );

  const selectedResultsTermName = useMemo(
    () => terms.find((t) => t.id === selectedResultsTermId)?.term_name ?? selectedResultsTermId,
    [terms, selectedResultsTermId]
  );

  const isSummary404 = Boolean(summary.error && /\(HTTP 404\)/.test(summary.error));
  const isResults404 = Boolean(results.error && /\(HTTP 404\)/.test(results.error));
  const isAllSelected = !category.trim() || category.trim().toUpperCase() === "ALL";

  const governmentRows = useMemo(() => {
    if (!isAllSelected) return [];
    return resultRows.filter((row) => {
      const r = row as Record<string, unknown>;
      return String(r.category ?? "").toUpperCase() === "GOVERNMENT";
    });
  }, [isAllSelected, resultRows]);

  const selfSponsoredRows = useMemo(() => {
    if (!isAllSelected) return [];
    return resultRows.filter((row) => {
      const r = row as Record<string, unknown>;
      return String(r.category ?? "").toUpperCase() === "SELF_SPONSORED";
    });
  }, [isAllSelected, resultRows]);

  // Reset every paginator whenever the user changes term/category/size
  // — the in-memory list could shrink, so an out-of-range page index
  // would render an empty table.
  useEffect(() => {
    setGovPage(1);
    setSelfPage(1);
    setSinglePage(1);
  }, [selectedResultsTermId, category, resultsPageSize, resultRows.length]);

  const govPageRows = useMemo(() => {
    const start = (govPage - 1) * resultsPageSize;
    return governmentRows.slice(start, start + resultsPageSize);
  }, [governmentRows, govPage, resultsPageSize]);

  const selfPageRows = useMemo(() => {
    const start = (selfPage - 1) * resultsPageSize;
    return selfSponsoredRows.slice(start, start + resultsPageSize);
  }, [selfSponsoredRows, selfPage, resultsPageSize]);

  const singlePageRows = useMemo(() => {
    const start = (singlePage - 1) * resultsPageSize;
    return resultRows.slice(start, start + resultsPageSize);
  }, [resultRows, singlePage, resultsPageSize]);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Section
        title="Run Ranking & Eligibility"
        subtitle="Start ranking pipeline with AI agents"
      >
        <div className="mb-3">
          <label className="mb-1 block text-[12px] font-semibold text-[#3a3a3a]">
            Admission term
          </label>
          <select
            value={selectedRunTermId}
            onChange={(e) => setSelectedRunTermId(e.target.value)}
            disabled={termsLoading || terms.length === 0}
            className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none disabled:opacity-60"
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
        <button
          type="button"
          disabled={!selectedRunTermId}
          onClick={() =>
            callApi(
              setRankingRun,
              `/api/v1/undergraduate/ranking/run?admission_term_id=${encodeURIComponent(selectedRunTermId)}`,
              "POST"
            )
          }
          className="mb-3 h-[36px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
        >
          Run Ranking
        </button>
        {rankingRun.loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Running ranking pipeline…</p>
        ) : rankingRun.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {rankingRun.error}
          </p>
        ) : rankingRun.data ? (
          <p className="text-[13px] font-semibold text-green-700">
            Ranking ran successfully.
          </p>
        ) : null}
      </Section>

      <Section
        title="Ranking Summary"
        subtitle="Show cut-off points and assigned count by admission term"
      >
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <select
            value={selectedSummaryTermId}
            onChange={(e) => setSelectedSummaryTermId(e.target.value)}
            disabled={termsLoading || terms.length === 0}
            className="h-[36px] rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none disabled:opacity-60"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.term_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!selectedSummaryTermId.trim()) {
                setSummary({ loading: false, error: "Admission term is required.", data: null });
                return;
              }
              callApi(
                setSummary,
                `/api/v1/undergraduate/ranking/results/${encodeURIComponent(selectedSummaryTermId.trim())}/summary`,
                "GET"
              );
            }}
            className="h-[36px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f]"
          >
            Get Summary
          </button>
        </div>
        {summary.loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading summary…</p>
        ) : isSummary404 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-[13px] text-[#7a5a00]">
            No summary found for term &quot;{selectedSummaryTermName}&quot;.
          </p>
        ) : summary.error ? (
          <JsonResult state={summary} />
        ) : summaryData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-2 text-[12px]">
                <p className="text-[#5a5a5a]">Total assigned</p>
                <p className="text-[16px] font-bold text-[#2f76b7]">{summaryData.total_assigned ?? 0}</p>
              </div>
              <div className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-2 text-[12px]">
                <p className="text-[#5a5a5a]">Total unassigned</p>
                <p className="text-[16px] font-bold text-[#2f76b7]">{summaryData.total_unassigned ?? 0}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Program cutoffs</p>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[700px] border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                      <th className="px-3 py-2">Program</th>
                      <th className="px-3 py-2">Stream</th>
                      <th className="px-3 py-2">Capacity</th>
                      <th className="px-3 py-2">Assigned</th>
                      <th className="px-3 py-2">Cutoff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summaryData.program_cutoffs ?? []).map((p, idx) => (
                      <tr key={String(p.program_id ?? idx)} className="border-b border-gray-100">
                        <td className="px-3 py-2">{p.program_name ?? p.program_code ?? "—"}</td>
                        <td className="px-3 py-2">{p.stream ?? "—"}</td>
                        <td className="px-3 py-2">{p.max_capacity ?? 0}</td>
                        <td className="px-3 py-2">{p.assigned_count ?? 0}</td>
                        <td className="px-3 py-2">{p.cutoff_score ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </Section>

      <Section
        title="Ranking Results"
        subtitle="Get ranked list by admission term, optional category"
      >
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <select
            value={selectedResultsTermId}
            onChange={(e) => setSelectedResultsTermId(e.target.value)}
            disabled={termsLoading || terms.length === 0}
            className="h-[36px] rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none disabled:opacity-60"
          >
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.term_name}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-[36px] rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none"
          >
            <option value="ALL">ALL</option>
            <option value="SELF_SPONSORED">SELF_SPONSORED</option>
            <option value="GOVERNMENT">GOVERNMENT</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (!selectedResultsTermId.trim()) {
                setResults({ loading: false, error: "Admission term is required.", data: null });
                return;
              }
              const selectedCategory = category.trim().toUpperCase();
              const query =
                selectedCategory && selectedCategory !== "ALL"
                  ? `?category=${encodeURIComponent(selectedCategory)}`
                  : "";
              callApi(
                setResults,
                `/api/v1/undergraduate/ranking/results/${encodeURIComponent(selectedResultsTermId.trim())}${query}`,
                "GET"
              );
            }}
            className="h-[36px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f]"
          >
            Get Results
          </button>
        </div>
        {results.loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading ranking results…</p>
        ) : isResults404 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center text-[13px] text-[#7a5a00]">
            No results found for term &quot;{selectedResultsTermName}&quot;.
          </p>
        ) : results.error ? (
          <JsonResult state={results} />
        ) : resultRows.length === 0 && results.data ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No ranking results found for the selected term.
          </p>
        ) : resultRows.length > 0 && isAllSelected ? (
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-[#2f76b7]">Government</h3>
              {governmentRows.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                        <th className="px-3 py-2">Rank</th>
                        <th className="px-3 py-2">Applicant</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Final Score</th>
                        <th className="px-3 py-2">Assigned</th>
                        <th className="px-3 py-2">Stream</th>
                        <th className="px-3 py-2">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {govPageRows.map((row, idx) => {
                        const r = row as Record<string, unknown>;
                        return (
                          <tr key={String(r.id ?? `gov-${idx}`)} className="border-b border-gray-100">
                            <td className="px-3 py-2 font-semibold text-[#2f76b7]">
                              {typeof r.rank_position === "number" ? r.rank_position : "—"}
                            </td>
                            <td className="px-3 py-2">{String(r.applicant_full_name ?? "—")}</td>
                            <td className="px-3 py-2">{String(r.category ?? "—")}</td>
                            <td className="px-3 py-2">{typeof r.final_score === "number" ? r.final_score : "—"}</td>
                            <td className="px-3 py-2">{r.is_assigned ? "Yes" : "No"}</td>
                            <td className="px-3 py-2">{String(r.assigned_stream ?? "—")}</td>
                            <td className="px-3 py-2">{String(r.assigned_program_department ?? "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  <Pagination
                    page={govPage}
                    pageSize={resultsPageSize}
                    total={governmentRows.length}
                    onPageChange={setGovPage}
                    onPageSizeChange={setResultsPageSize}
                    itemLabel="applicants"
                  />
                </div>
              ) : (
                <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-3 text-[13px] text-[#5a5a5a]">
                  No government applicants found.
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-[#2f76b7]">Self Sponsored</h3>
              {selfSponsoredRows.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                        <th className="px-3 py-2">Rank</th>
                        <th className="px-3 py-2">Applicant</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Final Score</th>
                        <th className="px-3 py-2">Assigned</th>
                        <th className="px-3 py-2">Stream</th>
                        <th className="px-3 py-2">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selfPageRows.map((row, idx) => {
                        const r = row as Record<string, unknown>;
                        return (
                          <tr key={String(r.id ?? `self-${idx}`)} className="border-b border-gray-100">
                            <td className="px-3 py-2 font-semibold text-[#2f76b7]">
                              {typeof r.rank_position === "number" ? r.rank_position : "—"}
                            </td>
                            <td className="px-3 py-2">{String(r.applicant_full_name ?? "—")}</td>
                            <td className="px-3 py-2">{String(r.category ?? "—")}</td>
                            <td className="px-3 py-2">{typeof r.final_score === "number" ? r.final_score : "—"}</td>
                            <td className="px-3 py-2">{r.is_assigned ? "Yes" : "No"}</td>
                            <td className="px-3 py-2">{String(r.assigned_stream ?? "—")}</td>
                            <td className="px-3 py-2">{String(r.assigned_program_department ?? "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                  <Pagination
                    page={selfPage}
                    pageSize={resultsPageSize}
                    total={selfSponsoredRows.length}
                    onPageChange={setSelfPage}
                    onPageSizeChange={setResultsPageSize}
                    itemLabel="applicants"
                  />
                </div>
              ) : (
                <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-3 text-[13px] text-[#5a5a5a]">
                  No self-sponsored applicants found.
                </p>
              )}
            </div>
          </div>
        ) : resultRows.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Applicant</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Final Score</th>
                  <th className="px-3 py-2">Assigned</th>
                  <th className="px-3 py-2">Stream</th>
                  <th className="px-3 py-2">Department</th>
                </tr>
              </thead>
              <tbody>
                {singlePageRows.map((row, idx) => {
                  const r = row as Record<string, unknown>;
                  return (
                    <tr key={String(r.id ?? idx)} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-semibold text-[#2f76b7]">
                        {typeof r.rank_position === "number" ? r.rank_position : "—"}
                      </td>
                      <td className="px-3 py-2">{String(r.applicant_full_name ?? "—")}</td>
                      <td className="px-3 py-2">{String(r.category ?? "—")}</td>
                      <td className="px-3 py-2">{typeof r.final_score === "number" ? r.final_score : "—"}</td>
                      <td className="px-3 py-2">{r.is_assigned ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">{String(r.assigned_stream ?? "—")}</td>
                      <td className="px-3 py-2">{String(r.assigned_program_department ?? "—")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <Pagination
              page={singlePage}
              pageSize={resultsPageSize}
              total={resultRows.length}
              onPageChange={setSinglePage}
              onPageSizeChange={setResultsPageSize}
              itemLabel="applicants"
            />
          </div>
        ) : null}
      </Section>
    </div>
  );
}
