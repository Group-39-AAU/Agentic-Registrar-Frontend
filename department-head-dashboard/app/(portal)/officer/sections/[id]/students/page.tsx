"use client";

import { useEffect, useState } from "react";
import {
  fetchJson,
  semesterToYear,
  statusStyles,
  useSectionCtx,
  type StudentResponse,
} from "../shared";
import { usePageTitle } from "@/components/usePageTitle";

export default function SectionStudentsPage() {
  usePageTitle("Section Students");
  const { sectionId } = useSectionCtx();
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchJson<StudentResponse[]>(
      `/api/v1/courses/sections/${encodeURIComponent(sectionId)}/students`,
    )
      .then((data) => {
        if (!cancelled) setStudents(Array.isArray(data) ? data : []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load students.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  return (
    <section className="aau-card overflow-hidden rounded-2xl">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-[16px] font-bold text-[#1f2f40]">Enrolled students</h2>
        <p className="mt-0.5 text-[12.5px] text-[#5a5a5a]">
          Ordered by student ID. Empty list means the allocation agent hasn&apos;t placed
          anyone here yet.
        </p>
      </div>
      {loading ? (
        <div className="flex flex-col items-center gap-3 px-5 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
          <p className="text-[13px] text-[#5a5a5a]">Loading students…</p>
        </div>
      ) : error ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      ) : students.length === 0 ? (
        <p className="m-5 rounded-md border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-8 text-center text-[13px] text-[#5a5a5a]">
          No students have been allocated to this section yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-gray-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f6_100%)] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Student ID</th>
                <th className="px-5 py-3">Full name</th>
                <th className="px-5 py-3">Year · Sem</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => {
                const y = semesterToYear(s.current_semester);
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-100 transition-colors hover:bg-[#eef4fa]/40 ${
                      idx % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"
                    }`}
                  >
                    <td className="px-5 py-3 tabular-nums text-[#5a5a5a]">{idx + 1}</td>
                    <td className="px-5 py-3 font-mono text-[#1f5b94]">{s.student_id}</td>
                    <td className="px-5 py-3 font-medium text-[#1a1a1a]">{s.full_name}</td>
                    <td className="px-5 py-3 text-[#3a3a3a]">
                      {y ? `Year ${y.year} · Sem ${y.sem}` : `Sem ${s.current_semester}`}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyles(s.enrollment_status)}`}
                      >
                        {s.enrollment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
