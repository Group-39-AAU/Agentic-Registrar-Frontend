"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { labelForComponentId } from "@/lib/assessmentOptions";
import { listSubmissions } from "@/lib/submissionsStorage";
import type { GradeSubmissionRecord } from "@/lib/submissionsStorage";

function statusBadge(status: GradeSubmissionRecord["status"]) {
  if (status === "ACCEPTED") {
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">Accepted</span>;
  }
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Needs attention</span>;
}

export default function SubmissionsPage() {
  const [items, setItems] = useState<GradeSubmissionRecord[]>([]);

  useEffect(() => {
    setItems(listSubmissions());
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">Submissions</h1>
        <p className="mt-2 max-w-[760px] text-[14px] text-[#4a5568]">
          Batches you submit in this demo are stored only in this browser. Accepted rows are shown as accepted;
          rejected rows stay in “needs attention” until reasoning satisfies the simulated check.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-[14px] text-[#5a5a5a]">
          No submissions yet — start from{" "}
          <Link href="/courses" className="font-semibold text-[#2f76b7] underline">
            My courses
          </Link>{" "}
          (pick year and calendar semester, then enter grades).
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Components</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#1a1a1a]">{s.courseCode}</div>
                    <div className="text-[12px] text-[#5a5a5a]">{s.courseTitle}</div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#4a5568]">
                    {s.components.map((c) => labelForComponentId(c)).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                    {new Date(s.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/grades/enter?submission=${encodeURIComponent(s.id)}${
                        s.academicYear && s.calendarSemester
                          ? `&year=${encodeURIComponent(s.academicYear)}&semester=${encodeURIComponent(s.calendarSemester)}`
                          : ""
                      }`}
                      className="font-semibold text-[#2f76b7] hover:underline"
                    >
                      {s.status === "ACCEPTED" ? "View / update" : "Continue"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
