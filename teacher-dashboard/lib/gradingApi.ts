/**
 * Typed client for the Track-B grading endpoints used by the
 * teacher dashboard. Reuses the JWT stored in
 * ``localStorage["teacher_dashboard_token"]`` after login.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const TEACHER_TOKEN_KEY = "teacher_dashboard_token";

export function getTeacherToken(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(TEACHER_TOKEN_KEY);
  return v && v.trim() ? v : null;
}

export function setTeacherToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TEACHER_TOKEN_KEY, token);
}

export function clearTeacherToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TEACHER_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(extractMessage(body) ?? `Request failed (HTTP ${status})`);
    this.name = "ApiError";
  }
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string") return b.detail;
  if (b.detail && typeof b.detail === "object") {
    const d = b.detail as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
  }
  if (Array.isArray(b.detail)) {
    const parts = b.detail
      .map((e: unknown) =>
        e && typeof e === "object" && "msg" in e
          ? String((e as { msg?: string }).msg ?? "")
          : "",
      )
      .filter(Boolean);
    if (parts.length) return parts.join(". ");
  }
  if (typeof b.message === "string") return b.message;
  return null;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getTeacherToken();
  const headers: Record<string, string> = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────

export type LoginResponse = {
  access_token: string;
  token_type: string;
  must_change_password: boolean;
};

export async function loginTeacher(
  identifier: string,
  password: string,
): Promise<LoginResponse> {
  // /auth/login uses OAuth2PasswordRequestForm — form-encoded body
  // with ``username`` + ``password`` fields, not JSON.
  const body = new URLSearchParams();
  body.set("username", identifier);
  body.set("password", password);
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) throw new ApiError(res.status, data);
  return data as LoginResponse;
}

export type CurrentUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
};

export async function fetchMe(): Promise<CurrentUser> {
  return request<CurrentUser>("/api/v1/auth/me");
}

// ── Term catalog ─────────────────────────────────────────────────

export type CourseTerm = {
  id: string;
  term_name: string;
  phase: string;
  start_date?: string;
  end_date?: string;
  is_open?: boolean;
};

export async function fetchTerms(): Promise<CourseTerm[]> {
  return request<CourseTerm[]>("/api/v1/courses/terms");
}

// ── Instructor schedule ──────────────────────────────────────────
// One weekly meeting the calling instructor teaches in a term. The
// backend resolves the instructor from the JWT, so only term_id is
// needed. Returned as a flat list across all the instructor's sections.
export type InstructorScheduleSlot = {
  section_id: string;
  section_code: string;
  department: string;
  semester: number;
  room?: string | null;
  course_code: string;
  course_title: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

/** GET /api/v1/courses/instructors/me/schedule?term_id=... */
export async function fetchMyInstructorSchedule(
  termId: string,
): Promise<InstructorScheduleSlot[]> {
  return request<InstructorScheduleSlot[]>(
    `/api/v1/courses/instructors/me/schedule?term_id=${encodeURIComponent(termId)}`,
  );
}

// ── Instructor sections ──────────────────────────────────────────

export type InstructorSectionAssignment = {
  section_id: string;
  section_code: string;
  section_department: string;
  section_semester: number;
  course_id: string;
  course_code: string;
  course_title: string;
  course_credit_hours: number;
  term_id: string;
  slot_count: number;
};

export async function fetchMySections(
  termId: string,
): Promise<InstructorSectionAssignment[]> {
  return request<InstructorSectionAssignment[]>(
    `/api/v1/courses/grading/me/sections?term_id=${encodeURIComponent(termId)}`,
  );
}

// ── Roster ───────────────────────────────────────────────────────

export type RosterStudent = {
  student_id: string;
  student_number: string;
  full_name: string;
  current_semester: number;
  registration_id: string;
  is_added_via_drop: boolean;
};

export type SectionCourseRoster = {
  section_id: string;
  section_code: string;
  course_id: string;
  course_code: string;
  course_title: string;
  term_id: string;
  total: number;
  original_count: number;
  added_count: number;
  students: RosterStudent[];
};

export async function fetchRoster(
  sectionId: string,
  courseId: string,
): Promise<SectionCourseRoster> {
  return request<SectionCourseRoster>(
    `/api/v1/courses/grading/sections/${encodeURIComponent(sectionId)}/courses/${encodeURIComponent(courseId)}/roster`,
  );
}

// ── Breakdown ────────────────────────────────────────────────────

export type AssessmentComponent = {
  id: string;
  name: string;
  weight: number;
  max_score: number;
  order_index: number;
};

export type AssessmentBreakdown = {
  id: string;
  section_id: string;
  course_id: string;
  instructor_id: string;
  term_id: string;
  version: number;
  locked_at: string | null;
  components: AssessmentComponent[];
};

export type ComponentInput = {
  name: string;
  weight: number;
  /** Defaults to ``weight`` server-side if omitted. */
  max_score?: number;
};

export async function fetchBreakdown(
  sectionId: string,
  courseId: string,
): Promise<AssessmentBreakdown | null> {
  try {
    return await request<AssessmentBreakdown>(
      `/api/v1/courses/grading/sections/${encodeURIComponent(sectionId)}/courses/${encodeURIComponent(courseId)}/breakdown`,
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function upsertBreakdown(
  sectionId: string,
  courseId: string,
  components: ComponentInput[],
): Promise<AssessmentBreakdown> {
  return request<AssessmentBreakdown>(
    `/api/v1/courses/grading/sections/${encodeURIComponent(sectionId)}/courses/${encodeURIComponent(courseId)}/breakdown`,
    { method: "POST", body: JSON.stringify({ components }) },
  );
}

// ── Grade batch ──────────────────────────────────────────────────

export type GradeSubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "FLAGGED"
  | "REJECTED"
  | "AUTHORISED";

export type ScoreCell = {
  student_id: string;
  component_id: string;
  score: number | null;
};

export type StudentBatchRow = {
  student_id: string;
  student_number: string;
  full_name: string;
  is_added_via_drop: boolean;
  is_complete: boolean;
  scores: ScoreCell[];
};

export type GradeBatch = {
  id: string;
  section_id: string;
  section_code: string;
  course_id: string;
  course_code: string;
  course_title: string;
  course_credit_hours: number;
  term_id: string;
  instructor_id: string;
  breakdown_id: string;
  status: GradeSubmissionStatus;
  iteration_count: number;
  submitted_at: string | null;
  instructor_justification: string | null;
  breakdown: AssessmentBreakdown;
  rows: StudentBatchRow[];
};

/** Fetches the active grade batch for a section/course pair, creating one if none exists. */
export async function getOrCreateBatch(
  sectionId: string,
  courseId: string,
): Promise<GradeBatch> {
  return request<GradeBatch>(
    `/api/v1/courses/grading/sections/${encodeURIComponent(sectionId)}/courses/${encodeURIComponent(courseId)}/batch`,
    { method: "POST" },
  );
}

export type ScoreWrite = {
  student_id: string;
  component_id: string;
  score: number | null;
};

export async function upsertScores(
  batchId: string,
  cells: ScoreWrite[],
): Promise<GradeBatch> {
  return request<GradeBatch>(
    `/api/v1/courses/grading/batches/${encodeURIComponent(batchId)}/scores`,
    { method: "PUT", body: JSON.stringify({ cells }) },
  );
}

export async function deleteAllScores(batchId: string): Promise<GradeBatch> {
  return request<GradeBatch>(
    `/api/v1/courses/grading/batches/${encodeURIComponent(batchId)}/scores`,
    { method: "DELETE" },
  );
}

export type GradeLetter =
  | "A_PLUS" | "A" | "A_MINUS"
  | "B_PLUS" | "B" | "B_MINUS"
  | "C_PLUS" | "C" | "C_MINUS"
  | "D" | "F" | "I" | "W" | "NG";

export type SubmittedGradeRow = {
  student_id: string;
  student_number: string;
  full_name: string;
  numeric_score: number;
  letter_grade: GradeLetter;
};

export type AgentVerdict = "APPROVE" | "FLAG" | "PENDING";

export type GradeBatchSubmitResponse = {
  batch_id: string;
  status: GradeSubmissionStatus;
  iteration: number;
  submitted_at: string;
  agent_verdict: AgentVerdict;
  agent_flags: Array<Record<string, unknown>>;
  agent_reasoning: string;
  grades: SubmittedGradeRow[];
};

export async function submitBatch(
  batchId: string,
): Promise<GradeBatchSubmitResponse> {
  return request<GradeBatchSubmitResponse>(
    `/api/v1/courses/grading/batches/${encodeURIComponent(batchId)}/submit`,
    { method: "POST" },
  );
}

/** Resubmits a flagged batch with a teacher justification for the agent to re-evaluate. */
export async function justifyBatch(
  batchId: string,
  justification: string,
): Promise<GradeBatchSubmitResponse> {
  return request<GradeBatchSubmitResponse>(
    `/api/v1/courses/grading/batches/${encodeURIComponent(batchId)}/justify`,
    { method: "POST", body: JSON.stringify({ justification }) },
  );
}

export async function reopenBatch(batchId: string): Promise<GradeBatch> {
  return request<GradeBatch>(
    `/api/v1/courses/grading/batches/${encodeURIComponent(batchId)}/reopen`,
    { method: "POST" },
  );
}

export type AgentReview = {
  id: string;
  iteration: number;
  verdict: AgentVerdict;
  flags: Array<Record<string, unknown>>;
  llm_reasoning: string | null;
  tool_findings: Record<string, unknown>;
  agent_id: string;
  created_at: string;
};

export async function listAgentReviews(
  batchId: string,
): Promise<AgentReview[]> {
  return request<AgentReview[]>(
    `/api/v1/courses/grading/batches/${encodeURIComponent(batchId)}/agent-reviews`,
  );
}

// ── UI helpers ───────────────────────────────────────────────────

/** Converts a GradeLetter enum value to its display string (e.g. `"A_PLUS"` → `"A+"`). */
export function formatLetter(letter: GradeLetter): string {
  switch (letter) {
    case "A_PLUS": return "A+";
    case "A_MINUS": return "A-";
    case "B_PLUS": return "B+";
    case "B_MINUS": return "B-";
    case "C_PLUS": return "C+";
    case "C_MINUS": return "C-";
    default: return letter;
  }
}

/** Title-cases a term phase string (e.g. `"grading"` → `"Grading"`). */
export function formatPhase(phase: string): string {
  if (!phase) return phase;
  return phase.charAt(0).toUpperCase() + phase.slice(1).toLowerCase();
}

/**
 * Extracts human-readable lines from an `incomplete_grade_submission` error body.
 * Returns an empty array for any other error shape.
 */
export function describeIncomplete(body: unknown): string[] {
  if (!body || typeof body !== "object") return [];
  const b = body as Record<string, unknown>;
  const detail = b.detail;
  if (!detail || typeof detail !== "object") return [];
  const d = detail as Record<string, unknown>;
  if (d.code !== "incomplete_grade_submission") return [];
  const missing = d.missing;
  if (!Array.isArray(missing)) return [];
  return missing
    .map((m) => {
      if (!m || typeof m !== "object") return "";
      const row = m as Record<string, unknown>;
      const name = String(row.full_name ?? row.student_number ?? "Student");
      const comps = Array.isArray(row.missing_components)
        ? (row.missing_components as unknown[]).join(", ")
        : "";
      return `${name}: ${comps}`;
    })
    .filter(Boolean);
}
