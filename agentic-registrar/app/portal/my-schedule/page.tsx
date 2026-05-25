"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import {
  ApiError,
  acceptSectionForCourse,
  fetchCourseTerms,
  fetchMySchedule,
  fetchScheduleOptionsForCourse,
  type CourseTerm,
  type MyScheduleResponse,
  type SchedulePendingAddition,
  type ScheduleSectionOption,
  type ScheduleSlot,
} from "@/lib/api";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatPhase(phase: string): string {
  if (!phase) return phase;
  return phase.charAt(0).toUpperCase() + phase.slice(1).toLowerCase();
}

const ROMAN_YEAR = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
function semesterToYear(currentSemester: number): string {
  if (!currentSemester || currentSemester < 1) return "";
  const year = Math.ceil(currentSemester / 2);
  return ROMAN_YEAR[year - 1] ?? String(year);
}

type ParsedSlot = ScheduleSlot & {
  day: Day;
  startMin: number;
  endMin: number;
};

function parseSlots(slots: ScheduleSlot[]): ParsedSlot[] {
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

function minutesToTimeStr(total: number): string {
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Merge back-to-back slots of the SAME course on the SAME day into one
 * block. A course split into consecutive hourly rows (e.g. 08:00–09:00
 * + 09:00–10:00) is shown as a single 08:00–10:00 block. Only contiguous
 * slots merge — a real gap (e.g. a 10:00–11:00 break) keeps them apart.
 * A merged block counts as an "addition" if any of its parts came from
 * an add/drop addition.
 */
function mergeContiguousSlots(slots: ParsedSlot[]): ParsedSlot[] {
  const groups = new Map<string, ParsedSlot[]>();
  slots.forEach((s) => {
    const key = `${s.day}__${s.course_id ?? s.course_code}`;
    const list = groups.get(key) ?? [];
    list.push(s);
    groups.set(key, list);
  });

  const merged: ParsedSlot[] = [];
  groups.forEach((list) => {
    const sorted = [...list].sort((a, b) => a.startMin - b.startMin);
    let run: ParsedSlot | null = null;
    const rooms = new Set<string>();
    let isAddition = false;

    const flush = () => {
      if (!run) return;
      merged.push({
        ...run,
        start_time: minutesToTimeStr(run.startMin),
        end_time: minutesToTimeStr(run.endMin),
        room: rooms.size > 0 ? Array.from(rooms).join(", ") : run.room,
        source: isAddition ? "addition" : run.source,
      });
    };

    sorted.forEach((s) => {
      if (run && s.startMin <= run.endMin) {
        // contiguous (or overlapping) — extend the running block
        run = { ...run, endMin: Math.max(run.endMin, s.endMin) };
      } else {
        flush();
        run = { ...s };
        rooms.clear();
        isAddition = false;
      }
      if (s.room) rooms.add(s.room);
      if (s.source === "addition") isAddition = true;
    });
    flush();
  });

  return merged;
}

function WeeklyGrid({ slots }: { slots: ScheduleSlot[] }) {
  const parsed = useMemo(() => mergeContiguousSlots(parseSlots(slots)), [slots]);

  if (parsed.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-10 text-center text-[14px] text-[#5a5a5a]">
        Schedule is not available for the selected semester.
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
        <div className="grid grid-cols-[80px_repeat(var(--days),minmax(0,1fr))] border-b border-[#dde6ef]" style={{ ["--days" as never]: days.length } as React.CSSProperties}>
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
                {/* Hour grid lines */}
                {hourLines.map((t) => (
                  <div
                    key={t}
                    className="pointer-events-none absolute inset-x-0 border-t border-dashed border-[#eef2f6]"
                    style={{ top: `${(t - startMin) * PX_PER_MIN}px` }}
                  />
                ))}

                {/* Slots */}
                {list.map((slot, idx) => {
                  const top = (slot.startMin - startMin) * PX_PER_MIN;
                  const height = (slot.endMin - slot.startMin) * PX_PER_MIN;
                  const palette = colorFor(slot.course_code || slot.course_title);
                  return (
                    <div
                      key={`${slot.course_code}-${slot.startMin}-${idx}`}
                      className={`absolute left-1 right-1 overflow-hidden rounded-md border ${palette.border} ${palette.bg} px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_18px_-12px_rgba(31,91,148,0.35)] transition-transform hover:-translate-y-[1px] hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_14px_24px_-12px_rgba(31,91,148,0.5)]`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-md ${palette.accent}`} />
                      {slot.source === "addition" ? (
                        <span className="absolute right-1 top-1 rounded-full bg-[#c98c2a] px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
                          Added
                        </span>
                      ) : null}
                      <div className={`pl-1 ${palette.text}`}>
                        <p className={`truncate text-[11px] font-semibold uppercase tracking-wide ${slot.source === "addition" ? "pr-10" : ""}`}>
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
                        {height >= 80 ? (
                          <p
                            className="mt-0.5 truncate text-[10.5px] text-[#5a5a5a]"
                            title={
                              slot.instructor_name
                                ? `${slot.instructor_name}${slot.instructor_staff_id ? ` · ${slot.instructor_staff_id}` : ""}`
                                : "Instructor not assigned"
                            }
                          >
                            {slot.instructor_name ?? "TBA"}
                          </p>
                        ) : null}
                        {slot.room && height >= 100 ? (
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

function fmtTime(t: string): string {
  return t ? t.slice(0, 5) : t;
}

function SlotLine({
  slot,
}: {
  slot: {
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
    instructor_name?: string | null;
  };
}) {
  const day = normalizeDay(slot.day_of_week);
  return (
    <span className="tabular-nums">
      {day ? DAY_LABEL[day] : slot.day_of_week} {fmtTime(slot.start_time)}–{fmtTime(slot.end_time)}
      {slot.room ? ` · Room ${slot.room}` : ""}
      {slot.instructor_name ? ` · ${slot.instructor_name}` : ""}
    </span>
  );
}

function SectionPickerModal({
  addition,
  termId,
  onClose,
  onAccepted,
}: {
  addition: SchedulePendingAddition;
  termId: string;
  onClose: () => void;
  onAccepted: () => void;
}) {
  const [options, setOptions] = useState<ScheduleSectionOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchScheduleOptionsForCourse(addition.course_id, termId)
      .then((data) => {
        if (!cancelled) setOptions(data.options ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(
            err.message && err.message !== "Request failed"
              ? err.message
              : `Could not load section options (status ${err.status}).`,
          );
        } else {
          setError("Could not load section options.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addition.course_id, termId]);

  async function handlePick(sectionId: string) {
    if (submittingId) return;
    setSubmittingId(sectionId);
    setSubmitError(null);
    try {
      await acceptSectionForCourse(addition.course_id, sectionId, termId);
      onAccepted();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError(
          err.message && err.message !== "Request failed"
            ? err.message
            : "That section now conflicts with your schedule. Refresh and try another.",
        );
      } else if (err instanceof ApiError) {
        setSubmitError(
          err.message && err.message !== "Request failed"
            ? err.message
            : `Could not add the section (status ${err.status}).`,
        );
      } else {
        setSubmitError("Could not add the section.");
      }
      setSubmittingId(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-picker-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[8vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[8px] border border-[#d9d9d9] bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e4e4e4] px-5 py-3">
          <div>
            <h2 id="section-picker-title" className="text-[16px] font-semibold text-[#1f1f1f]">
              Choose a section
            </h2>
            <p className="text-[12px] text-[#5a5a5a]">
              {addition.course_code} · {addition.course_title}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-[22px] leading-none text-[#5a5a5a] hover:text-[#1f1f1f]"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
              <p className="text-[13px] text-[#5a5a5a]">Loading section options…</p>
            </div>
          ) : error ? (
            <p className="rounded-md border border-[#f0bcbc] bg-[#fdebeb] px-3 py-3 text-[13px] font-semibold text-[#a31a1a]">
              {error}
            </p>
          ) : !options || options.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-8 text-center text-[13px] text-[#5a5a5a]">
              No sections are currently scheduled for this course. Check back once the registrar runs scheduling.
            </p>
          ) : (
            <>
              {submitError ? (
                <p className="mb-3 rounded-md border border-[#f0bcbc] bg-[#fdebeb] px-3 py-2 text-[12px] font-semibold text-[#a31a1a]">
                  {submitError}
                </p>
              ) : null}
              <ul className="space-y-3">
                {options.map((opt) => {
                  const busy = submittingId === opt.section_id;
                  return (
                    <li
                      key={opt.section_id}
                      className={`rounded-lg border px-4 py-3 ${
                        opt.is_viable
                          ? "border-[#cfddec] bg-white"
                          : "border-[#f0d9d9] bg-[#fdf4f4]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-[12px]">
                          <span className="rounded-full bg-[#eef4fa] px-2.5 py-1 font-semibold text-[#1f5b94]">
                            Section {opt.section_code}
                          </span>
                          {opt.is_viable ? (
                            <span className="rounded-full bg-[#e9f6ec] px-2.5 py-1 font-semibold text-[#1f6d33]">
                              No conflicts
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#fcecec] px-2.5 py-1 font-semibold text-[#8b2c2c]">
                              {opt.conflicts.length} conflict{opt.conflicts.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={!opt.is_viable || busy}
                          onClick={() => handlePick(opt.section_id)}
                          className="rounded-md bg-[#2f76b7] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#27689f] disabled:cursor-not-allowed disabled:bg-[#b9c6d4]"
                        >
                          {busy ? "Adding…" : opt.is_viable ? "Add this section" : "Unavailable"}
                        </button>
                      </div>

                      <ul className="mt-2 space-y-1 text-[12px] text-[#3a3a3a]">
                        {opt.slots.map((s) => (
                          <li key={s.slot_id} className="flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2f76b7]" />
                            <SlotLine slot={s} />
                          </li>
                        ))}
                      </ul>

                      {!opt.is_viable && opt.conflicts.length > 0 ? (
                        <div className="mt-2 rounded-md border border-[#f0d9d9] bg-[#fff5f5] px-3 py-2 text-[11.5px] text-[#8b2c2c]">
                          <p className="mb-1 font-semibold uppercase tracking-wide">Clashes with</p>
                          <ul className="space-y-1">
                            {opt.conflicts.map((c, i) => (
                              <li key={`${opt.section_id}-conflict-${i}`}>
                                <SlotLine slot={c.candidate} /> overlaps{" "}
                                <span className="font-semibold">{c.collides_with.course_code}</span>{" "}
                                (<SlotLine slot={c.collides_with} />)
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MySchedulePage() {
  const [terms, setTerms] = useState<CourseTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const [academicYear, setAcademicYear] = useState("");
  const [calendarSemester, setCalendarSemester] = useState("");

  const [schedule, setSchedule] = useState<MyScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerCourse, setPickerCourse] = useState<SchedulePendingAddition | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTermsLoading(true);
    setTermsError(null);
    fetchCourseTerms()
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

  const loadSchedule = useCallback(
    async (termId: string, opts: { silent?: boolean } = {}) => {
      if (!opts.silent) {
        setLoading(true);
        setSchedule(null);
      }
      setError(null);
      try {
        const data = await fetchMySchedule(termId);
        setSchedule(data);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          setError("Schedule is not available for the selected semester.");
        } else if (err instanceof ApiError) {
          setError(
            err.message && err.message !== "Request failed"
              ? err.message
              : "Schedule is not available for the selected semester.",
          );
        } else {
          setError("Schedule is not available for the selected semester.");
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedTerm) {
      setSchedule(null);
      setError(null);
      return;
    }
    void loadSchedule(selectedTerm.id);
  }, [selectedTerm, loadSchedule]);

  function handleYearChange(v: string) {
    setAcademicYear(v);
    setCalendarSemester("");
  }

  const section = schedule?.section;
  const yearLabel = section?.semester ? semesterToYear(section.semester) : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] md:pr-[60px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 md:ml-[40px]">
            <div className="px-3 py-1 text-[16px] md:px-2">
              <div className="md:max-w-[1080px]">
                <h1 className="mb-2 border-b border-[#e0e0e0] pb-2 text-[22px] font-semibold text-[#222] md:text-[24px]">
                  My Schedule
                </h1>

                <div className="aau-card mt-4 rounded-xl p-4 md:p-5">
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

                {/* Section info */}
                {section ? (
                  <div className="aau-card mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 md:px-5">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-full bg-[#eef4fa] px-2.5 py-1 font-semibold text-[#1f5b94]">
                        Section {section.section_code}
                      </span>
                      <span className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[#3a3a3a]">
                        {section.department}
                      </span>
                      {yearLabel ? (
                        <span className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[#3a3a3a]">
                          Year {yearLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[12px] text-[#5a5a5a]">
                      <span className="font-semibold text-[#1f2f40]">
                        {section.enrolled_count}
                      </span>{" "}
                      / {section.capacity} enrolled
                    </p>
                  </div>
                ) : null}

                {/* Body */}
                <div className="mt-5">
                  {!selectedTerm ? (
                    <p className="rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-10 text-center text-[14px] text-[#5a5a5a]">
                      Pick an academic year and semester to view your schedule.
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
                  ) : schedule ? (
                    <div className="aau-card overflow-hidden rounded-xl">
                      <WeeklyGrid slots={schedule.slots} />
                    </div>
                  ) : null}

                  {schedule && schedule.pending_additions && schedule.pending_additions.length > 0 ? (
                    <div className="aau-card mt-5 rounded-xl p-4 md:p-5">
                      <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a5a00]">
                        Pending additions
                      </p>
                      <p className="mb-3 text-[12px] text-[#5a5a5a]">
                        These added courses aren&apos;t on your timetable yet. Pick a section that doesn&apos;t
                        clash with your current schedule to slot each one in.
                      </p>
                      <ul className="space-y-2">
                        {schedule.pending_additions.map((p) => (
                          <li key={p.course_id}>
                            <button
                              type="button"
                              onClick={() => setPickerCourse(p)}
                              className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md border border-[#f0d9a0] bg-[#fff7e2] px-3 py-2 text-left text-[13px] text-[#8a5a00] transition-colors hover:border-[#e6c477] hover:bg-[#fdefcf]"
                            >
                              <span className="font-semibold">
                                {p.course_code} · {p.course_title}
                              </span>
                              <span className="flex items-center gap-2 text-[12px]">
                                {p.credit_hours} cr
                                <span className="rounded-full bg-[#c98c2a] px-2.5 py-1 text-[11px] font-semibold text-white">
                                  Choose section
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <PortalFooter />

      {pickerCourse && selectedTerm ? (
        <SectionPickerModal
          addition={pickerCourse}
          termId={selectedTerm.id}
          onClose={() => setPickerCourse(null)}
          onAccepted={() => {
            setPickerCourse(null);
            void loadSchedule(selectedTerm.id, { silent: true });
          }}
        />
      ) : null}
    </div>
  );
}
