"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiError,
  fetchRoster,
  fetchTerms,
  type SectionCourseRoster,
} from "@/lib/gradingApi";

export default function RosterViewClient() {
  const params = useSearchParams();
  const sectionId = params.get("section_id") ?? "";
  const courseId = params.get("course_id") ?? "";
  const termId = params.get("term_id") ?? "";

  const [roster, setRoster] = useState<SectionCourseRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [termLabel, setTermLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId || !courseId) {
      setError("Missing section_id or course_id in the URL.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetchRoster(sectionId, courseId);
        if (!cancelled) setRoster(data);
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          if (e.status === 403) {
            setError("You aren't assigned to teach this (section, course) pair.");
          } else if (e.status === 401) {
            setError("Your session has expired — please log in again.");
          } else {
            setError(e.message ?? "Could not load the roster.");
          }
        } else {
          setError("Could not load the roster.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sectionId, courseId]);

  useEffect(() => {
    if (!termId) {
      setTermLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const terms = await fetchTerms();
        if (cancelled) return;
        const t = terms.find((x) => x.id === termId);
        if (t) {
          const phase = t.phase
            ? `${t.phase.charAt(0).toUpperCase()}${t.phase.slice(1).toLowerCase()}`
            : "";
          setTermLabel(phase ? `${t.term_name} · ${phase}` : t.term_name);
        }
      } catch {
        // best-effort; fall back to id stub inline
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [termId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/courses"
          className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2f76b7] hover:underline"
        >
          ← Back to my courses
        </Link>
        {termId ? (
          <p className="text-[11px] text-[#5a5a5a]">
            Term{" "}
            <span className="font-semibold text-[#1f2f40]">
              {termLabel ?? `${termId.slice(0, 8)}…`}
            </span>
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </p>
      ) : loading ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading roster…</p>
      ) : roster ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[20px] font-bold text-[#1f2f40]">
                  <span className="font-mono text-[#1f5b94]">
                    {roster.course_code}
                  </span>{" "}
                  · {roster.course_title}
                </h1>
                <p className="mt-1 text-[12.5px] text-[#5a5a5a]">
                  Section <strong>{roster.section_code}</strong> ·{" "}
                  {roster.total} student{roster.total === 1 ? "" : "s"} (
                  {roster.original_count} original
                  {roster.added_count > 0
                    ? `, ${roster.added_count} added via add/drop`
                    : ""}
                  )
                </p>
              </div>
              <Link
                href={`/grades/enter?section_id=${encodeURIComponent(roster.section_id)}&course_id=${encodeURIComponent(roster.course_id)}&term_id=${encodeURIComponent(roster.term_id)}`}
                className="h-[34px] rounded-md bg-[#3f79b5] px-4 text-[12.5px] font-semibold leading-[34px] text-white hover:bg-[#356e9f]"
              >
                Enter grades →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Student</th>
                  <th className="px-3 py-2 text-left">UGR ID</th>
                  <th className="px-3 py-2 text-right">Semester</th>
                  <th className="px-3 py-2 text-center">Origin</th>
                </tr>
              </thead>
              <tbody>
                {roster.students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-[12.5px] italic text-[#5a5a5a]"
                    >
                      No students are currently registered for this (section,
                      course) pair.
                    </td>
                  </tr>
                ) : (
                  roster.students.map((s, idx) => (
                    <tr
                      key={s.student_id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-3 py-2 tabular-nums text-[#5a5a5a]">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-[#1f2f40]">
                          {s.full_name}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[12px] text-[#3a3a3a]">
                        {s.student_number}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {s.current_semester}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {s.is_added_via_drop ? (
                          <span className="rounded-full bg-[#fff3d4] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#8a5a00]">
                            add/drop
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#5a5a5a]">
                            cohort
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
