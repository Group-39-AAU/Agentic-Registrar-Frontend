"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  fetchMySections,
  fetchTerms,
  formatPhase,
  type CourseTerm,
  type InstructorSectionAssignment,
} from "@/lib/gradingApi";

export default function CoursesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const termFromUrl = searchParams.get("term_id") ?? "";

  const [terms, setTerms] = useState<CourseTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(true);
  const [termsError, setTermsError] = useState<string | null>(null);

  const [pickerTerm, setPickerTerm] = useState<string>(termFromUrl);
  const [sections, setSections] = useState<InstructorSectionAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load term catalog.
  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    setTermsError(null);
    fetchTerms()
      .then((rows) => {
        if (cancelled) return;
        setTerms(rows);
        // If no term has been picked yet, default to the open term
        // (or the most recent one).
        if (!termFromUrl) {
          const openTerm = rows.find((t) => t.is_open);
          const fallback = openTerm ?? rows[0];
          if (fallback) setPickerTerm(fallback.id);
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof ApiError) {
          setTermsError(
            e.status === 401
              ? "Your session has expired — please log in again."
              : e.message ?? "Could not load terms.",
          );
        } else {
          setTermsError("Could not load terms.");
        }
      })
      .finally(() => {
        if (!cancelled) setTermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [termFromUrl]);

  // Load my sections when a term is in the URL.
  const loadSections = useCallback(
    async (termId: string) => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchMySections(termId);
        setSections(rows);
      } catch (e: unknown) {
        if (e instanceof ApiError) {
          if (e.status === 403) {
            setError(
              "Your account isn't authorised as an instructor for this surface.",
            );
          } else if (e.status === 401) {
            setError("Your session has expired — please log in again.");
          } else {
            setError(e.message ?? "Could not load your sections.");
          }
        } else {
          setError("Could not load your sections.");
        }
        setSections([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!termFromUrl) {
      setSections([]);
      return;
    }
    void loadSections(termFromUrl);
  }, [termFromUrl, loadSections]);

  const selectedTerm = useMemo(
    () => terms.find((t) => t.id === termFromUrl) ?? null,
    [terms, termFromUrl],
  );

  function applyTermChoice() {
    if (!pickerTerm) return;
    const params = new URLSearchParams();
    params.set("term_id", pickerTerm);
    router.replace(`/courses?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">My courses</h1>
        <p className="mt-2 text-[14px] text-[#4a5568]">
          Pick a term to see every (section × course) pair you teach. Click
          “Enter grades” to define the assessment breakdown, score the roster,
          and submit for department-head review.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {termsError ? (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {termsError}
          </p>
        ) : null}
        <div className="flex max-w-[560px] flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
              Academic term
            </label>
            <select
              value={pickerTerm}
              onChange={(e) => setPickerTerm(e.target.value)}
              disabled={termsLoading || terms.length === 0}
              className="h-[42px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2f76b7] disabled:opacity-60"
            >
              <option value="">
                {termsLoading
                  ? "Loading terms…"
                  : terms.length === 0
                    ? "No terms available"
                    : "Select a term"}
              </option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.term_name} · {formatPhase(t.phase)}
                  {t.is_open ? " · open" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={applyTermChoice}
            disabled={!pickerTerm}
            className="h-[42px] shrink-0 rounded-md bg-[#3f79b5] px-6 text-[14px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
          >
            Load sections
          </button>
        </div>
      </div>

      {selectedTerm ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe0f5] bg-[#f0f7ff] px-4 py-3 text-[13px] text-[#1a365d]">
          <span>
            Showing sections for{" "}
            <strong>
              {selectedTerm.term_name} · {formatPhase(selectedTerm.phase)}
            </strong>
            {selectedTerm.is_open ? " · open" : ""}
          </span>
          <button
            type="button"
            onClick={() => router.replace("/courses")}
            className="text-[12px] font-semibold text-[#2f76b7] underline"
          >
            Change term
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      {termFromUrl && loading ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading your sections…</p>
      ) : null}

      {termFromUrl && !loading && sections.length === 0 && !error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          You have no section assignments in this term.
        </p>
      ) : null}

      {termFromUrl && !loading && sections.length > 0 ? (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-right">Semester</th>
                <th className="px-4 py-3 text-right">Credits</th>
                <th className="px-4 py-3 text-right">Slots/wk</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr
                  key={`${s.section_id}:${s.course_id}`}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-[12.5px] font-semibold text-[#1f5b94]">
                      {s.course_code}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[#1f2f40]">
                      {s.course_title}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#1f2f40]">
                    {s.section_code}
                  </td>
                  <td className="px-4 py-3 text-[#3a3a3a]">
                    {s.section_department}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {s.section_semester}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {s.course_credit_hours}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#5a5a5a]">
                    {s.slot_count}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/roster?section_id=${encodeURIComponent(s.section_id)}&course_id=${encodeURIComponent(s.course_id)}&term_id=${encodeURIComponent(s.term_id)}`}
                        className="font-semibold text-[#2f76b7] hover:underline"
                      >
                        View roster
                      </Link>
                      <Link
                        href={`/grades/enter?section_id=${encodeURIComponent(s.section_id)}&course_id=${encodeURIComponent(s.course_id)}&term_id=${encodeURIComponent(s.term_id)}`}
                        className="font-semibold text-[#2f76b7] hover:underline"
                      >
                        Enter grades
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
