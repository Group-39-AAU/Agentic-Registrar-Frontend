"use client";

import { WeeklyGrid, useSectionCtx } from "../shared";

export default function SectionSchedulePage() {
  const { schedule, scheduleLoading, scheduleError } = useSectionCtx();

  return (
    <section className="aau-card overflow-hidden rounded-2xl">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-[16px] font-bold text-[#1f2f40]">Weekly schedule</h2>
        <p className="mt-0.5 text-[12.5px] text-[#5a5a5a]">
          Sorted by day, then start time. Times are 24-hour; room shown when assigned.
        </p>
      </div>
      {scheduleLoading ? (
        <div className="flex flex-col items-center gap-3 px-5 py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
          <p className="text-[13px] text-[#5a5a5a]">Loading schedule…</p>
        </div>
      ) : scheduleError ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {scheduleError}
        </div>
      ) : schedule ? (
        <div className="p-3 sm:p-5">
          <WeeklyGrid slots={schedule.slots} />
        </div>
      ) : null}
    </section>
  );
}
