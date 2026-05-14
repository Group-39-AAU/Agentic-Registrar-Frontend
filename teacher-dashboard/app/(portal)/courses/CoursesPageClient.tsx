"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { TeacherCourse } from "@/lib/mockCourses";
import {
  calendarSemesterLabel,
  CALENDAR_SEMESTER_OPTIONS,
  MAX_ACTIVE_TEACHER_COURSES,
  parseCalendarSemesterId,
  STATIC_COURSE_COUNT,
  staticStudentCountForCourse,
  TEACHER_ACADEMIC_YEARS,
} from "@/lib/mockCourses";
import { fetchTeacherCourses } from "@/lib/teacherApi";

export default function CoursesPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const yearFromUrl = searchParams.get("year");
  const semesterFromUrl = parseCalendarSemesterId(searchParams.get("semester"));

  const [pickerYear, setPickerYear] = useState<string>(TEACHER_ACADEMIC_YEARS[TEACHER_ACADEMIC_YEARS.length - 1]);
  const [pickerSemester, setPickerSemester] = useState<(typeof CALENDAR_SEMESTER_OPTIONS)[number]["id"]>("1");

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semesterChosen = Boolean(yearFromUrl && semesterFromUrl);

  useEffect(() => {
    if (!yearFromUrl || !semesterFromUrl) {
      setCourses([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTeacherCourses(yearFromUrl, semesterFromUrl)
      .then((list) => {
        if (!cancelled) setCourses(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load courses.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [yearFromUrl, semesterFromUrl]);

  function applySemesterChoice() {
    const params = new URLSearchParams();
    params.set("year", pickerYear);
    params.set("semester", pickerSemester);
    router.replace(`/courses?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">My courses</h1>
        <p className="mt-2 text-[14px] text-[#4a5568]">
          Choose the academic year and calendar semester first. You will see at most {MAX_ACTIVE_TEACHER_COURSES}{" "}
          active courses for that period (demo data from a catalog of {STATIC_COURSE_COUNT} sections with large
          rosters).
        </p>
      </div>

      {!semesterChosen ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1a1a1a]">Select period</h2>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">
            Pick the academic year and calendar semester (one, two, or three) to load your assigned sections.
          </p>
          <div className="mt-5 flex max-w-[520px] flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                Academic year
              </label>
              <select
                value={pickerYear}
                onChange={(e) => setPickerYear(e.target.value)}
                className="h-[42px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2f76b7]"
              >
                {TEACHER_ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                Calendar semester
              </label>
              <select
                value={pickerSemester}
                onChange={(e) =>
                  setPickerSemester(e.target.value as (typeof CALENDAR_SEMESTER_OPTIONS)[number]["id"])
                }
                className="h-[42px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2f76b7]"
              >
                {CALENDAR_SEMESTER_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={applySemesterChoice}
              className="h-[42px] shrink-0 rounded-md bg-[#3f79b5] px-6 text-[14px] font-semibold text-white hover:bg-[#356e9f]"
            >
              View courses
            </button>
          </div>
        </div>
      ) : null}

      {semesterChosen ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe0f5] bg-[#f0f7ff] px-4 py-3 text-[13px] text-[#1a365d]">
          <span>
            Showing <strong>{yearFromUrl}</strong> · calendar semester <strong>{calendarSemesterLabel(semesterFromUrl!)}</strong> · up to{" "}
            {MAX_ACTIVE_TEACHER_COURSES} courses
          </span>
          <button
            type="button"
            onClick={() => router.replace("/courses")}
            className="text-[12px] font-semibold text-[#2f76b7] underline"
          >
            Change year / semester
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
      ) : null}

      {semesterChosen && loading ? (
        <p className="text-[13px] text-[#5a5a5a]">Loading courses…</p>
      ) : null}

      {semesterChosen && !loading && courses.length === 0 && !error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          No courses found for this year and calendar semester in the demo catalog.
        </p>
      ) : null}

      {semesterChosen && !loading && courses.length > 0 ? (
        <div className="max-h-[min(70vh,720px)] overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a] shadow-sm">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3 text-right">Students</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-[#1a1a1a]">{c.code}</td>
                  <td className="px-4 py-3 text-[#333]">{c.title}</td>
                  <td className="px-4 py-3 text-[#5a5a5a]">{c.academicYear}</td>
                  <td className="px-4 py-3 text-[#5a5a5a]">{c.section ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#5a5a5a]">
                    {staticStudentCountForCourse(c.id)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/grades/enter?course=${encodeURIComponent(c.id)}&year=${encodeURIComponent(yearFromUrl!)}&semester=${encodeURIComponent(semesterFromUrl!)}`}
                      className="font-semibold text-[#2f76b7] hover:underline"
                    >
                      Enter grades
                    </Link>
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
