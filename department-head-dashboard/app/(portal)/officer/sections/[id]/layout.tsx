"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  SectionProvider,
  fetchJson,
  semesterToYear,
  type SectionScheduleResponse,
} from "./shared";

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const sectionId = params?.id ?? "";

  const [schedule, setSchedule] = useState<SectionScheduleResponse | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionId) return;
    let cancelled = false;
    setScheduleLoading(true);
    setScheduleError(null);
    fetchJson<SectionScheduleResponse>(
      `/api/v1/courses/sections/${encodeURIComponent(sectionId)}/schedule`,
    )
      .then((data) => {
        if (!cancelled) setSchedule(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setScheduleError(err instanceof Error ? err.message : "Could not load section.");
      })
      .finally(() => {
        if (!cancelled) setScheduleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionId]);

  const section = schedule?.section ?? null;
  const yearLabel = section ? semesterToYear(section.semester) : null;
  const capacityFill =
    section && section.capacity > 0
      ? Math.min(100, Math.round((section.enrolled_count / section.capacity) * 100))
      : 0;

  return (
    <SectionProvider value={{ sectionId, schedule, scheduleLoading, scheduleError }}>
      <div className="space-y-6">
        {/* Back link */}
        <div className="flex items-center gap-3 text-[12px] font-semibold tracking-[0.08em] text-[#5a5a5a]">
          <Link
            href="/officer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 uppercase text-[#2f76b7] hover:bg-[#2f76b7]/[0.08]"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
            Back to Officer
          </Link>
        </div>

        {/* Section header */}
        <section className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,120,183,0.15)_0%,transparent_70%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f76b7]">
                Section
              </p>
              <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40]">
                {scheduleLoading
                  ? "Loading…"
                  : section
                    ? `Section ${section.section_code} · ${section.department}`
                    : "Section"}
              </h1>
              {section ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                  {yearLabel ? (
                    <span className="rounded-full bg-[#eef4fa] px-2.5 py-1 font-semibold text-[#1f5b94]">
                      Year {yearLabel.year} · Sem {yearLabel.sem}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[#3a3a3a]">
                    Semester {section.semester}
                  </span>
                  <span className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[#3a3a3a]">
                    {section.enrolled_count} / {section.capacity} enrolled
                  </span>
                </div>
              ) : null}
            </div>

            {section ? (
              <div className="w-full max-w-[240px] sm:w-auto">
                <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#5a5a5a]">
                  Capacity
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef2f6]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#3a86c4_0%,#2f78b7_100%)] transition-[width]"
                    style={{ width: `${capacityFill}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] tabular-nums text-[#5a5a5a]">
                  {capacityFill}%
                </p>
              </div>
            ) : null}
          </div>

        </section>

        {children}
      </div>
    </SectionProvider>
  );
}
