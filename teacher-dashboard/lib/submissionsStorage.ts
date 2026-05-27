import type { AssessmentComponentId } from "./assessmentOptions";
import type { CalendarSemesterId } from "./mockCourses";
import { parseCalendarSemesterId } from "./mockCourses";

export type GradeRow = {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  scores: Record<AssessmentComponentId, string>;
};

export type GradeSubmissionRecord = {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  academicYear?: string;
  calendarSemester?: CalendarSemesterId;
  components: AssessmentComponentId[];
  rows: GradeRow[];
  status: "REJECTED" | "ACCEPTED";
  aiFeedback?: string;
  reasoningHistory: { at: string; text: string }[];
  createdAt: string;
  updatedAt: string;
};

/** localStorage key; versioned so schema changes don't silently corrupt old records. */
const STORAGE_KEY = "teacher_dashboard_grade_submissions_v1";

type StoredSubmission = GradeSubmissionRecord & { term?: unknown };

/**
 * Migrates a raw stored object to GradeSubmissionRecord.
 * The legacy `term` field ("I"/"II") is mapped to the current calendarSemester ("1"/"2").
 */
function normalizeSubmission(item: unknown): GradeSubmissionRecord | null {
  if (!item || typeof item !== "object") return null;
  const o = item as StoredSubmission;
  let calendarSemester = o.calendarSemester;
  if (!parseCalendarSemesterId(calendarSemester ?? null)) {
    if (o.term === "I" || o.term === "i") calendarSemester = "1";
    else if (o.term === "II" || o.term === "ii") calendarSemester = "2";
  }
  if (!parseCalendarSemesterId(calendarSemester ?? null)) calendarSemester = undefined;
  const { term: _ignored, ...rest } = o;
  return { ...rest, calendarSemester };
}

function readAll(): GradeSubmissionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSubmission).filter((x): x is GradeSubmissionRecord => x !== null);
  } catch {
    return [];
  }
}

function writeAll(items: GradeSubmissionRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Returns all stored submissions sorted newest-first by `updatedAt`. */
export function listSubmissions(): GradeSubmissionRecord[] {
  return readAll().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

/** Finds a single submission by its ID, or returns `null` if not found. */
export function getSubmission(id: string): GradeSubmissionRecord | null {
  return readAll().find((s) => s.id === id) ?? null;
}

/** Inserts the record if new, or replaces the existing entry with the same ID. */
export function upsertSubmission(record: GradeSubmissionRecord) {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === record.id);
  if (idx === -1) all.unshift(record);
  else all[idx] = record;
  writeAll(all);
}

/** Generates a collision-resistant submission ID using timestamp + random suffix. */
export function newSubmissionId(): string {
  return `gs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
