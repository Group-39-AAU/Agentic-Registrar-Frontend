"use client";

import { RequestState, Section, callApi, initialState } from "@/components/ApiHelpers";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useState } from "react";

type ReviewRow = {
  rank_position?: number;
  application_id?: string;
  id?: string;
  admission_number?: string;
  student_name?: string;
  sponsorship_type?: string;
  stream?: string;
  status?: string;
  current_status?: string;
  final_score?: number;
};

type SponsorshipFilter = "ALL" | "SELF_SPONSORED" | "GOVERNMENT";

export default function ReviewPage() {
  const router = useRouter();
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [sponsorshipFilter, setSponsorshipFilter] = useState<SponsorshipFilter>("ALL");

  const [students, setStudents] = useState<RequestState>(initialState);
  const [decisionResult, setDecisionResult] = useState<RequestState>(initialState);

  const loadStudents = async () => {
    setStudents({ loading: true, error: null, data: null });
    try {
      const token = localStorage.getItem("admin_dashboard_token") ?? "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;

      const [selfRes, govRes] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/undergraduate/review/students?sponsorship_type=SELF_SPONSORED`,
          { headers }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/undergraduate/review/students?sponsorship_type=GOVERNMENT`,
          { headers }
        ),
      ]);
      const selfData = await selfRes.json().catch(() => ({}));
      const govData = await govRes.json().catch(() => ({}));

      if (!selfRes.ok || !govRes.ok) {
        throw new Error("Could not load review queue.");
      }

      const selfItems = Array.isArray(selfData)
        ? selfData
        : selfData && typeof selfData === "object" && Array.isArray((selfData as { items?: unknown[] }).items)
          ? (selfData as { items: unknown[] }).items
          : [];
      const govItems = Array.isArray(govData)
        ? govData
        : govData && typeof govData === "object" && Array.isArray((govData as { items?: unknown[] }).items)
          ? (govData as { items: unknown[] }).items
          : [];

      const map = new Map<string, ReviewRow>();
      [...selfItems, ...govItems].forEach((item) => {
        if (!item || typeof item !== "object") return;
        const r = item as ReviewRow;
        const key = String(r.application_id ?? r.id ?? "");
        if (!key) return;
        if (!map.has(key)) map.set(key, r);
      });
      const list = Array.from(map.values());
      setStudents({ loading: false, error: null, data: list });
      setSelectedIds((prev) => prev.filter((id) => list.some((r) => String(r.application_id ?? r.id ?? "") === id)));
    } catch (e) {
      setStudents({
        loading: false,
        error: e instanceof Error ? e.message : "Could not load review queue.",
        data: null,
      });
    }
  };

  useEffect(() => {
    (async () => {
      await loadStudents();
    })();
  }, []);

  const allRows = useMemo(() => {
    if (Array.isArray(students.data)) return students.data as ReviewRow[];
    return [];
  }, [students.data]);

  const rows = useMemo(() => {
    if (sponsorshipFilter === "ALL") return allRows;
    return allRows.filter(
      (r) => String(r.sponsorship_type ?? "").toUpperCase() === sponsorshipFilter
    );
  }, [allRows, sponsorshipFilter]);

  const allIds = useMemo(
    () => rows.map((row) => String(row.application_id ?? row.id ?? "")).filter(Boolean),
    [rows]
  );

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const onSingleDecision = async (applicationId: string) => {
    setDecidingId(applicationId);
    await callApi(
      setDecisionResult,
      `/api/v1/undergraduate/review/decide/${encodeURIComponent(applicationId)}`,
      "POST",
      {
        human_decision: "APPROVED",
        justification_remarks: "Decided by admissions officer via admin dashboard.",
      }
    );
    setDecidingId(null);
    await loadStudents();
  };

  const onBatchDecision = async () => {
    if (selectedIds.length === 0) return;
    setBatchLoading(true);
    await callApi(setDecisionResult, "/api/v1/undergraduate/review/decide/batch", "POST", {
      decisions: selectedIds.map((application_id) => ({
        application_id,
        human_decision: "APPROVED",
        justification_remarks: "Decided by admissions officer via admin dashboard.",
      })),
    });
    setBatchLoading(false);
    setSelectedIds([]);
    await loadStudents();
  };

  return (
    <div className="grid gap-5">
      <Section
        title="Students For Review"
        subtitle="Both sponsorship queues load together; use the filter to narrow the list."
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor="sponsorship-filter" className="text-[12px] font-semibold text-[#3a3a3a]">
            Sponsorship
          </label>
          <select
            id="sponsorship-filter"
            value={sponsorshipFilter}
            onChange={(e) => {
              setSponsorshipFilter(e.target.value as SponsorshipFilter);
              setSelectedIds([]);
            }}
            className="h-[36px] min-w-[200px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[13px] text-[#1a1a1a] outline-none"
          >
            <option value="ALL">All</option>
            <option value="SELF_SPONSORED">Self-sponsored</option>
            <option value="GOVERNMENT">Government</option>
          </select>
        </div>

        {selectedIds.length > 0 ? (
          <div className="mb-3 flex items-center justify-between rounded-md border border-[#c7d9ed] bg-[#eef4ff] px-3 py-2">
            <p className="text-[12px] text-[#2a66a7]">
              {selectedIds.length} student{selectedIds.length > 1 ? "s" : ""} selected
            </p>
            <button
              type="button"
              disabled={batchLoading}
              onClick={onBatchDecision}
              className="h-[32px] rounded-md bg-[#3f79b5] px-3 text-[12px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
            >
              {batchLoading ? "Deciding..." : "Decide Batch"}
            </button>
          </div>
        ) : null}

        <p className="mb-3 text-[13px] text-[#5a5a5a]">
          Showing <span className="font-semibold text-[#2f76b7]">{rows.length}</span>
          {sponsorshipFilter !== "ALL" ? (
            <>
              {" "}
              of <span className="font-semibold text-[#2f76b7]">{allRows.length}</span> loaded
            </>
          ) : null}
        </p>
        {students.loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading review queue…</p>
        ) : students.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {students.error}
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            {allRows.length > 0 && sponsorshipFilter !== "ALL"
              ? "No students match this sponsorship filter."
              : "No students awaiting review."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[980px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(allIds);
                        else setSelectedIds([]);
                      }}
                      aria-label="Select all students"
                    />
                  </th>
                  <th className="px-4 py-3">Ranking</th>
                  <th className="px-4 py-3">Admission #</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Sponsorship</th>
                  <th className="px-4 py-3">Stream</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const id = String(row.application_id ?? row.id ?? "");
                  return (
                    <tr
                      key={id || String(index)}
                      role={id ? "link" : undefined}
                      tabIndex={id ? 0 : -1}
                      className={`border-b border-gray-100 ${id ? "cursor-pointer hover:bg-[#eef4ff]/70" : ""}`}
                      onClick={() => {
                        if (id) router.push(`/review/${id}`);
                      }}
                      onKeyDown={(e) => {
                        if (!id) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (id) router.push(`/review/${id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          disabled={!id}
                          onChange={(e) => {
                            if (!id) return;
                            if (e.target.checked) {
                              setSelectedIds((prev) => Array.from(new Set([...prev, id])));
                            } else {
                              setSelectedIds((prev) => prev.filter((x) => x !== id));
                            }
                          }}
                          aria-label={`Select ${row.admission_number ?? id}`}
                        />
                      </td>
                     
                      <td className="px-4 py-3">{row.rank_position ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-[#2f76b7]">
                        {row.admission_number ?? "—"}
                      </td>
                      <td className="px-4 py-3">{row.student_name ?? "—"}</td>
                      <td className="px-4 py-3">{row.sponsorship_type ?? "—"}</td>
                      <td className="px-4 py-3">{row.stream ?? "—"}</td>
                      <td className="px-4 py-3">{row.status ?? row.current_status ?? "—"}</td>
                      <td className="px-4 py-3">
                        {typeof row.final_score === "number" ? row.final_score : "—"}
                      </td>
                     
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={!id || decidingId === id}
                          onClick={() => {
                            if (id) onSingleDecision(id);
                          }}
                          className="h-[30px] rounded-md bg-[#3f79b5] px-3 text-[11px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
                        >
                          {decidingId === id ? "Deciding..." : "Decide"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Decision Response</p>
          {decisionResult.loading ? (
            <p className="text-[13px] text-[#5a5a5a]">Deciding…</p>
          ) : decisionResult.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {decisionResult.error}
            </p>
          ) : decisionResult.data ? (
            <p className="text-[13px] font-semibold text-green-700">Decision made successfully.</p>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
