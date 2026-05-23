"use client";

import {
  ApiError,
  fetchMyInstructorSchedule,
  fetchTerms,
  formatPhase,
  type CourseTerm,
  type InstructorScheduleSlot,
} from "@/lib/gradingApi";
import { useEffect, useMemo, useState } from "react";

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type Day = (typeof DAY_ORDER)[number];

const DAY_LABEL: Record<Day, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const SLOT_PALETTE = [
  {
    bg: "bg-[linear-gradient(180deg,#e6f0fb_0%,#cfe1f4_100%)]",
    border: "border-[#a4c6e9]",
    accent: "bg-[#2f76b7]",
    text: "text-[#1f5b94]",
  },
  {
    bg: "bg-[linear-gradient(180deg,#e9f6ec_0%,#d3ebd9_100%)]",
    border: "border-[#a5d2af]",
    accent: "bg-[#2f9648]",
    text: "text-[#1f6d33]",
  },
  {
    bg: "bg-[linear-gradient(180deg,#fcecec_0%,#f6d3d3_100%)]",
    border: "border-[#e8acac]",
    accent: "bg-[#c95252]",
    text: "text-[#8b2c2c]",
  },
  {
    bg: "bg-[linear-gradient(180deg,#fbf2e2_0%,#f5e2bd_100%)]",
    border: "border-[#e6c990]",
    accent: "bg-[#c98c2a]",
    text: "text-[#8a5a00]",
  },
  {
    bg: "bg-[linear-gradient(180deg,#ede4f7_0%,#dbcdee_100%)]",
    border: "border-[#bda6dc]",
    accent: "bg-[#7449b3]",
    text: "text-[#4f2e80]",
  },
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return SLOT_PALETTE[Math.abs(hash) % SLOT_PALETTE.length];
}

function normalizeDay(d: string): Day | null {
  if (!d) return null;
  const upper = d.toUpperCase();
  const map: Record<string, Day> = {
    MON: "MONDAY",
    MONDAY: "MONDAY",
    TUE: "TUESDAY",
    TUES: "TUESDAY",
    TUESDAY: "TUESDAY",
    WED: "WEDNESDAY",
    WEDNESDAY: "WEDNESDAY",
    THU: "THURSDAY",
    THUR: "THURSDAY",
    THURS: "THURSDAY",
    THURSDAY: "THURSDAY",
    FRI: "FRIDAY",
    FRIDAY: "FRIDAY",
    SAT: "SATURDAY",
    SATURDAY: "SATURDAY",
    SUN: "SUNDAY",
    SUNDAY: "SUNDAY",
  };
  return map[upper] ?? null;
}

function timeToMinutes(t: string): number | null {
  if (!t) return null;
  const parts = t.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function formatHourLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function minutesToTimeStr(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

type ParsedSlot = InstructorScheduleSlot & {
  day: Day;
  startMin: number;
  endMin: number;
};

function parseSlots(slots: InstructorScheduleSlot[]): ParsedSlot[] {
  return slots
    .map((s) => {
      const day = normalizeDay(s.day_of_week);
      const startMin = timeToMinutes(s.start_time);
      const endMin = timeToMinutes(s.end_time);
      if (!day || startMin === null || endMin === null || endMin <= startMin) {
        return null;
      }
      return { ...s, day, startMin, endMin };
    })
    .filter((s): s is ParsedSlot => s !== null);
}

/**
 * Merge back-to-back meetings of the SAME course + section on the SAME
 * day into a single block. A 2-hour lecture split into consecutive
 * hourly rows shows as one block; a real gap keeps them separate.
 */
function mergeContiguousSlots(slots: ParsedSlot[]): ParsedSlot[] {
  const groups = new Map<string, ParsedSlot[]>();
  slots.forEach((s) => {
    const key = `${s.day}__${s.section_id}__${s.course_code}`;
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  });

  const merged: ParsedSlot[] = [];
  groups.forEach((list) => {
    const sorted = [...list].sort((a, b) => a.startMin - b.startMin);
    let run: ParsedSlot | null = null;
    const rooms = new Set<string>();

    const flush = () => {
      if (!run) return;
      merged.push({
        ...run,
        start_time: minutesToTimeStr(run.startMin),
        end_time: minutesToTimeStr(run.endMin),
        room: rooms.size > 0 ? Array.from(rooms).join(", ") : run.room,
      });
    };

    sorted.forEach((s) => {
      if (run && s.startMin <= run.endMin) {
        run = { ...run, endMin: Math.max(run.endMin, s.endMin) };
      } else {
        flush();
        run = { ...s };
        rooms.clear();
      }
      if (s.room) rooms.add(s.room);
    });
    flush();
  });

  return merged;
}

function WeeklyGrid({ slots }: { slots: InstructorScheduleSlot[] }) {
  const parsed = useMemo(() => mergeContiguousSlots(parseSlots(slots)), [slots]);

  if (parsed.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-10 text-center text-[14px] text-[#5a5a5a]">
        No teaching slots are scheduled for the selected semester.
      </p>
    );
  }

  const minMin = Math.min(...parsed.map((s) => s.startMin));
  const maxMin = Math.max(...parsed.map((s) => s.endMin));
  const startMin = Math.floor(minMin / 60) * 60;
  const endMin = Math.ceil(maxMin / 60) * 60;
  const totalMinutes = endMin - startMin;
  const PX_PER_MIN = 1.4;
  const gridHeight = totalMinutes * PX_PER_MIN;

  const hourLines: number[] = [];
  for (let t = startMin; t <= endMin; t += 60) hourLines.push(t);

  const daysWithData = new Set(parsed.map((s) => s.day));
  const baseDays: Day[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  if (daysWithData.has("SATURDAY")) baseDays.push("SATURDAY");
  if (daysWithData.has("SUNDAY")) baseDays.push("SUNDAY");
  const days = baseDays;

  const slotsByDay = new Map<Day, ParsedSlot[]>();
  parsed.forEach((s) => {
    const list = slotsByDay.get(s.day) ?? [];
    list.push(s);
    slotsByDay.set(s.day, list);
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Header row */}
        <div
          className="grid grid-cols-[80px_repeat(var(--days),minmax(0,1fr))] border-b border-[#dde6ef]"
          style={{ ["--days" as never]: days.length } as React.CSSProperties}
        >
          <div className="h-[44px]" />
          {days.map((day) => (
            <div
              key={day}
              className="flex h-[44px] items-center justify-center border-l border-[#eef2f6] text-[12px] font-semibold uppercase tracking-[0.1em] text-[#1f5b94]"
            >
              {DAY_LABEL[day]}
            </div>
          ))}
        </div>

        {/* Body */}
        <div
          className="relative grid grid-cols-[80px_repeat(var(--days),minmax(0,1fr))]"
          style={{ ["--days" as never]: days.length, height: `${gridHeight}px` } as React.CSSProperties}
        >
          {/* Time gutter */}
          <div className="relative border-r border-[#dde6ef]">
            {hourLines.map((t) => (
              <div
                key={t}
                className="absolute right-2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-[#5a5a5a]"
                style={{ top: `${(t - startMin) * PX_PER_MIN}px` }}
              >
                {formatHourLabel(t)}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const list = (slotsByDay.get(day) ?? []).sort((a, b) => a.startMin - b.startMin);
            return (
              <div key={day} className="relative border-l border-[#eef2f6]">
                {hourLines.map((t) => (
                  <div
                    key={t}
                    className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#eef2f6]"
                    style={{ top: `${(t - startMin) * PX_PER_MIN}px` }}
                  />
                ))}

                {list.map((slot, idx) => {
                  const top = (slot.startMin - startMin) * PX_PER_MIN;
                  const height = (slot.endMin - slot.startMin) * PX_PER_MIN;
                  const palette = colorFor(slot.course_code || slot.course_title);
                  return (
                    <div
                      key={`${slot.section_id}-${slot.course_code}-${slot.startMin}-${idx}`}
                      className={`absolute left-1 right-1 overflow-hidden rounded-md border ${palette.border} ${palette.bg} px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_18px_-12px_rgba(31,91,148,0.35)] transition-transform hover:-translate-y-[1px] hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_14px_24px_-12px_rgba(31,91,148,0.5)]`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-md ${palette.accent}`} />
                      <span className="absolute right-1 top-1 rounded-full bg-white/70 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide text-[#1f5b94] shadow-sm">
                        {slot.section_code}
                      </span>
                      <div className={`pl-1 ${palette.text}`}>
                        <p className="truncate pr-9 text-[11px] font-semibold uppercase tracking-wide">
                          {slot.course_code}
                        </p>
                        <p
                          className="overflow-hidden text-[12px] font-semibold leading-tight text-[#1f2f40]"
                          title={slot.course_title}
                          style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}
                        >
                          {slot.course_title}
                        </p>
                        {height >= 60 ? (
                          <p className="mt-1 text-[10.5px] tabular-nums text-[#3a3a3a]">
                            {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                          </p>
                        ) : null}
                        {slot.room && height >= 80 ? (
                          <p className="mt-0.5 truncate text-[10.5px] text-[#5a5a5a]">
                            Room {slot.room}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TeacherSchedulePage() {
  const [terms, setTerms] = useState<CourseTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const [academicYear, setAcademicYear] = useState("");
  const [calendarSemester, setCalendarSemester] = useState("");

  const [slots, setSlots] = useState<InstructorScheduleSlot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    setTermsError(null);
    fetchTerms()
      .then((data) => {
        if (!cancelled) setTerms(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTermsError(err instanceof Error ? err.message : "Could not load terms.");
        setTerms([]);
      })
      .finally(() => {
        if (!cancelled) setTermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const termsByYear = useMemo(() => {
    const m = new Map<string, CourseTerm[]>();
    terms.forEach((t) => {
      const list = m.get(t.term_name) ?? [];
      list.push(t);
      m.set(t.term_name, list);
    });
    return m;
  }, [terms]);

  const yearOptions = useMemo(() => Array.from(termsByYear.keys()), [termsByYear]);
  const phaseOptions = useMemo(() => {
    if (!academicYear) return [] as CourseTerm[];
    return termsByYear.get(academicYear) ?? [];
  }, [academicYear, termsByYear]);

  const selectedTerm = useMemo(() => {
    if (!academicYear || !calendarSemester) return null;
    return (termsByYear.get(academicYear) ?? []).find((t) => t.phase === calendarSemester) ?? null;
  }, [academicYear, calendarSemester, termsByYear]);

  useEffect(() => {
    if (!selectedTerm) {
      setSlots(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSlots(null);
    fetchMyInstructorSchedule(selectedTerm.id)
      .then((data) => {
        if (!cancelled) setSlots(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account has no instructor profile, so no schedule is available.");
        } else if (err instanceof ApiError) {
          setError(
            err.message && err.message !== "Request failed"
              ? err.message
              : "Schedule is not available for the selected semester.",
          );
        } else {
          setError("Schedule is not available for the selected semester.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTerm]);

  function handleYearChange(v: string) {
    setAcademicYear(v);
    setCalendarSemester("");
  }

  return (
    <div className="md:max-w-[1080px]">
      <h1 className="mb-2 border-b border-[#e0e0e0] pb-2 text-[22px] font-semibold text-[#222] md:text-[24px]">
        My Schedule
      </h1>

      {/* Term picker */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#3a3a3a]">
              Academic year
            </label>
            <select
              value={academicYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={termsLoading || yearOptions.length === 0}
              className="h-[40px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[14px] outline-none disabled:opacity-60"
            >
              <option value="">
                {termsLoading
                  ? "Loading terms…"
                  : yearOptions.length === 0
                    ? "No terms available"
                    : "Select academic year"}
              </option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#3a3a3a]">
              Calendar semester
            </label>
            <select
              value={calendarSemester}
              onChange={(e) => setCalendarSemester(e.target.value)}
              disabled={!academicYear || phaseOptions.length === 0}
              className="h-[40px] w-full rounded-md border border-[#9bb0cc] bg-white px-3 text-[14px] outline-none disabled:opacity-60"
            >
              <option value="">
                {!academicYear
                  ? "Pick an academic year first"
                  : phaseOptions.length === 0
                    ? "No semesters for this year"
                    : "Select calendar semester"}
              </option>
              {phaseOptions.map((p) => (
                <option key={p.id} value={p.phase}>
                  {formatPhase(p.phase)}
                  {p.is_open ? " · open" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {termsError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {termsError}
          </p>
        ) : null}
      </div>

      {/* Body */}
      <div className="mt-5">
        {!selectedTerm ? (
          <p className="rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-10 text-center text-[14px] text-[#5a5a5a]">
            Pick an academic year and semester to view your teaching schedule.
          </p>
        ) : loading ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
            <p className="text-[13px] text-[#5a5a5a]">Loading schedule…</p>
          </div>
        ) : error ? (
          <p className="rounded-lg border border-[#f0bcbc] bg-[linear-gradient(180deg,#fdebeb_0%,#f8d3d3_100%)] px-4 py-6 text-center text-[14px] font-semibold text-[#a31a1a] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-14px_rgba(163,26,26,0.35)]">
            {error}
          </p>
        ) : slots ? (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <WeeklyGrid slots={slots} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
