"use client";

import { createContext, useContext, useMemo } from "react";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

export async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail?: unknown }).detail ?? "")
        : "";
    throw new Error(detail ? `${detail} (HTTP ${res.status})` : `HTTP ${res.status}`);
  }
  return body as T;
}

export type EnrollmentStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "GRADUATED"
  | "WITHDRAWN"
  | string;

export type StudentResponse = {
  id: string;
  user_id: string;
  student_id: string;
  full_name: string;
  current_semester: number;
  enrollment_status: EnrollmentStatus;
};

export type SectionRead = {
  section_id: string;
  section_code: string;
  department: string;
  semester: number;
  capacity: number;
  enrolled_count: number;
};

export type ClassScheduleSlotRead = {
  course_code: string;
  course_title: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  instructor_id: string | null;
  instructor_name: string | null;
  instructor_staff_id: string | null;
  room: string | null;
  course_id: string | null;
  source: "cohort" | "addition" | null;
  source_section_id: string | null;
};

export type SectionScheduleResponse = {
  term_id: string;
  student_id: string | null;
  section: SectionRead | null;
  slots: ClassScheduleSlotRead[];
  pending_additions: unknown[];
};

const ROMAN_YEAR = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
export function semesterToYear(semester: number): { year: string; sem: number } | null {
  if (!semester || semester < 1) return null;
  const year = Math.ceil(semester / 2);
  const sem = ((semester - 1) % 2) + 1;
  return { year: ROMAN_YEAR[year - 1] ?? String(year), sem };
}

export function statusStyles(status: EnrollmentStatus): string {
  switch (status) {
    case "ACTIVE":
      return "bg-[#dff1e4] text-[#1f7a3a]";
    case "SUSPENDED":
      return "bg-[#fff3d4] text-[#8a5a00]";
    case "GRADUATED":
      return "bg-[#eef4fa] text-[#1f5b94]";
    case "WITHDRAWN":
      return "bg-[#fde0e0] text-[#a31a1a]";
    default:
      return "bg-[#f1f3f5] text-[#3a3a3a]";
  }
}

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
type Day = (typeof DAY_ORDER)[number];

const DAY_LABEL: Record<Day, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

const SLOT_PALETTE = [
  { bg: "bg-[linear-gradient(180deg,#e6f0fb_0%,#cfe1f4_100%)]", border: "border-[#a4c6e9]", accent: "bg-[#2f76b7]", text: "text-[#1f5b94]" },
  { bg: "bg-[linear-gradient(180deg,#e9f6ec_0%,#d3ebd9_100%)]", border: "border-[#a5d2af]", accent: "bg-[#2f9648]", text: "text-[#1f6d33]" },
  { bg: "bg-[linear-gradient(180deg,#fcecec_0%,#f6d3d3_100%)]", border: "border-[#e8acac]", accent: "bg-[#c95252]", text: "text-[#8b2c2c]" },
  { bg: "bg-[linear-gradient(180deg,#fbf2e2_0%,#f5e2bd_100%)]", border: "border-[#e6c990]", accent: "bg-[#c98c2a]", text: "text-[#8a5a00]" },
  { bg: "bg-[linear-gradient(180deg,#ede4f7_0%,#dbcdee_100%)]", border: "border-[#bda6dc]", accent: "bg-[#7449b3]", text: "text-[#4f2e80]" },
];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return SLOT_PALETTE[Math.abs(hash) % SLOT_PALETTE.length];
}

function normalizeDay(d: string): Day | null {
  if (!d) return null;
  const upper = d.toUpperCase();
  if ((DAY_ORDER as readonly string[]).includes(upper)) return upper as Day;
  const map: Record<string, Day> = {
    MONDAY: "MON",
    TUESDAY: "TUE",
    WEDNESDAY: "WED",
    THURSDAY: "THU",
    FRIDAY: "FRI",
    SATURDAY: "SAT",
    SUNDAY: "SUN",
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

type ParsedSlot = ClassScheduleSlotRead & {
  day: Day;
  startMin: number;
  endMin: number;
};

function parseSlots(slots: ClassScheduleSlotRead[]): ParsedSlot[] {
  return slots
    .map((s) => {
      const day = normalizeDay(s.day_of_week);
      const startMin = timeToMinutes(s.start_time);
      const endMin = timeToMinutes(s.end_time);
      if (!day || startMin === null || endMin === null || endMin <= startMin) return null;
      return { ...s, day, startMin, endMin };
    })
    .filter((s): s is ParsedSlot => s !== null);
}

function minutesToTimeStr(total: number): string {
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

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

export function WeeklyGrid({ slots }: { slots: ClassScheduleSlotRead[] }) {
  const parsed = useMemo(() => mergeContiguousSlots(parseSlots(slots)), [slots]);

  if (parsed.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] px-4 py-10 text-center text-[14px] text-[#5a5a5a]">
        The scheduling agent hasn&apos;t run for this section yet.
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
  const baseDays: Day[] = ["MON", "TUE", "WED", "THU", "FRI"];
  if (daysWithData.has("SAT")) baseDays.push("SAT");
  if (daysWithData.has("SUN")) baseDays.push("SUN");
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

        <div
          className="relative grid grid-cols-[80px_repeat(var(--days),minmax(0,1fr))]"
          style={{ ["--days" as never]: days.length, height: `${gridHeight}px` } as React.CSSProperties}
        >
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
                      key={`${slot.course_code}-${slot.startMin}-${idx}`}
                      className={`absolute left-1 right-1 overflow-hidden rounded-md border ${palette.border} ${palette.bg} px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_18px_-12px_rgba(31,91,148,0.35)] transition-transform hover:-translate-y-[1px] hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_14px_24px_-12px_rgba(31,91,148,0.5)]`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className={`absolute left-0 top-0 h-full w-[3px] rounded-l-md ${palette.accent}`} />
                      <div className={`pl-1 ${palette.text}`}>
                        <p className="truncate text-[11px] font-semibold uppercase tracking-wide">
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

type SectionCtx = {
  sectionId: string;
  schedule: SectionScheduleResponse | null;
  scheduleLoading: boolean;
  scheduleError: string | null;
};

const SectionContext = createContext<SectionCtx | null>(null);

export const SectionProvider = SectionContext.Provider;

export function useSectionCtx(): SectionCtx {
  const v = useContext(SectionContext);
  if (!v) throw new Error("Section context missing");
  return v;
}
