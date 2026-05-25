import { admissionTerm } from "./types";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

export const AUTH_TOKEN_KEY = "aau_registrar_access_token";
export const STUDENT_AUTH_TOKEN_KEY = "aau_registrar_student_access_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/** Saves token from login (`access_token`) or other auth responses. */
export function storeAuthFromResponse(data: unknown): void {
  if (typeof window === "undefined" || !data || typeof data !== "object")
    return;
  const d = data as Record<string, unknown>;
  const token =
    (typeof d.access_token === "string" && d.access_token) ||
    (typeof d.accessToken === "string" && d.accessToken) ||
    (typeof d.token === "string" && d.token);
  if (token) setAccessToken(token);
}

export function clearStoredAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredStudentAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);
}

export function setStudentAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STUDENT_AUTH_TOKEN_KEY, token);
}

export function clearStoredStudentAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STUDENT_AUTH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(getApiErrorMessage(body));
    this.name = "ApiError";
  }
}

export function getApiErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed";
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string") return b.detail;
  if (Array.isArray(b.detail)) {
    const parts = b.detail.map((e: unknown) => {
      if (e && typeof e === "object" && "msg" in e) {
        return String((e as { msg?: string }).msg ?? "");
      }
      return "";
    });
    const joined = parts.filter(Boolean).join(". ");
    return joined || "Validation error";
  }
  if (typeof b.message === "string") return b.message;
  return "Request failed";
}

export type RegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type RegisterUserResponse = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export async function registerUser(
  body: RegisterRequest
): Promise<RegisterUserResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as RegisterUserResponse;
}

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  /** True when the user must call POST /auth/change-password before any
   *  other endpoint will accept the token (freshly-onboarded students). */
  must_change_password?: boolean;
};

/**
 * POST /api/v1/auth/login — OAuth2-style form body (not JSON).
 * Same as: curl -d "username=...&password=..."
 */
export async function loginUser(body: LoginRequest): Promise<LoginResponse> {
  const params = new URLSearchParams();
  params.set("username", body.username);
  params.set("password", body.password);

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as LoginResponse;
}

/**
 * POST /api/v1/auth/forgot-password — request a password-reset email.
 * Resolves on 204 regardless of whether the email exists (backend
 * intentionally returns the same shape to prevent enumeration). Other
 * non-2xx responses still throw so the UI can show a real error.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new ApiError(res.status, data);
}

/**
 * POST /api/v1/auth/reset-password — finish a password reset using the
 * token from the email link. Backend verifies the JWT (purpose +
 * expiry), replaces the user's hash, and clears must_change_password.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new ApiError(res.status, data);
}

/**
 * POST /api/v1/auth/change-password — replace the temp PIN with a new
 * password. Requires the just-issued access token; the backend lifts
 * the must_change_password lockout on success.
 */
export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new ApiError(res.status, data);
}

export type StudentMeResponse = {
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  current_semester: number;
  sponsorship_type: string;
  enrollment_status: string;
  current_term?: {
    term_id: string;
    term_name: string;
    start_date: string;
    end_date: string;
    registration_status: string;
    section?: {
      section_id: string;
      section_code: string;
      capacity: number;
      enrolled_count: number;
    };
  };
};

export type CourseTerm = {
  id: string;
  term_name: string;
  phase: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  description?: string;
};

export type AvailableCourseItem = {
  id: string;
  code: string;
  title: string;
  credit_hours: number;
  semester: number;
  department: string;
};

export type AvailableCoursesResponse = {
  term: CourseTerm;
  is_registered: boolean;
  registration_id?: string | null;
  registration_status?: string;
  courses: AvailableCourseItem[];
};

/** GET /api/v1/courses/terms — requires student Bearer token. */
export async function fetchCourseTerms(): Promise<CourseTerm[]> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/terms`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return Array.isArray(data) ? (data as CourseTerm[]) : [];
}

/** POST /api/v1/courses/me/available-courses — requires student Bearer token. */
export async function fetchAvailableCourses(
  termId: string
): Promise<AvailableCoursesResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/me/available-courses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ term_id: termId }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(data)
  if (!res.ok) throw new ApiError(res.status, data);
  return data as AvailableCoursesResponse;
}

export type AdvisoryRecommendedCourse = {
  course_code: string;
  title: string;
  credit_hours: number;
  is_core: boolean;
  reason: string;
  requires_override: boolean;
};

export type AdvisoryGraduationImpact = {
  semesters_remaining: number;
  on_track: boolean;
  expected_graduation_semester: number;
  delay_semesters: number;
  critical_path_courses: string[];
};

export type AdvisoryRecommendation = {
  recommendation_id: string;
  student_id: string;
  term_id: string;
  mode: string;
  verdict: string;
  risk_status: "LOW" | "MEDIUM" | "HIGH" | string;
  narrative: string;
  recommended_courses: AdvisoryRecommendedCourse[];
  warnings: string[];
  graduation_impact: AdvisoryGraduationImpact;
  filtered_recommendations: string[];
  created_at: string;
};

export type RegistrationCourseInner = {
  code: string;
  title: string;
  credit_hours: number;
  semester?: number;
  department?: string;
};

export type RegistrationCourseRead = {
  /** Registration entry id (NOT the course id). */
  id: string;
  /** Course id — use this for add/drop consult/submit bodies. */
  course_id: string;
  section_id: string | null;
  is_dropped: boolean;
  /** A drop request is queued but not yet finalized. */
  pending_drop?: boolean;
  /** An add (re-add) request is queued but not yet finalized. */
  pending_add?: boolean;
  course: RegistrationCourseInner;
};

/** Catalog course the student can ADD for the first time (no
 *  RegistrationCourse row exists yet). Returned in
 *  AddDropPickerResponse.catalog_courses. Same `course` payload as
 *  RegistrationCourseRead so the UI can render both with one row
 *  component; `course_id` is what `/add-drop/batches` expects. */
export type CatalogAddableRead = {
  course_id: string;
  pending_add?: boolean;
  course: RegistrationCourseInner;
};

export type AddDropPickerResponse = {
  registration_id: string;
  term_id: string;
  term_name: string;
  registration_status: string;
  active_courses: RegistrationCourseRead[];
  dropped_courses: RegistrationCourseRead[];
  /** Department-matching catalog rows the student has neither
   *  registered for nor already passed — first-time ADD candidates,
   *  spanning past / current / future curriculum semesters. */
  catalog_courses: CatalogAddableRead[];
};

export type AddDropAction = "ADD" | "DROP";

export type AddDropItem = {
  course_id: string;
  action: AddDropAction;
};

export type AddDropBatchBody = {
  registration_id: string;
  items: AddDropItem[];
};

/** POST /api/v1/courses/add-drop/batches */
export async function submitAddDropBatch(
  body: AddDropBatchBody
): Promise<unknown> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/add-drop/batches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** GET /api/v1/courses/me/add-drop/picker
 *  Returns the student's active registration with two lists:
 *    - active_courses  → drop candidates
 *    - dropped_courses → add candidates
 *  404 when the student has no REGISTERED / ADD_DROP_WINDOW registration.
 */
export async function fetchAddDropPicker(): Promise<AddDropPickerResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/me/add-drop/picker`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as AddDropPickerResponse;
}

export type AddDropConsultBody = {
  add_course_ids?: string[];
  drop_course_ids?: string[];
};    

/** POST /api/v1/courses/advisory/consult/add-drop
 *  Body empty → proactive (agent suggests adds/drops).
 *  Body with one or both lists → guided (agent evaluates the hypothetical).
 */
export async function consultAddDrop(
  body: AddDropConsultBody = {}
): Promise<AdvisoryRecommendation> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const payload: AddDropConsultBody = {};
  if (body.add_course_ids && body.add_course_ids.length > 0) {
    payload.add_course_ids = body.add_course_ids;
  }
  if (body.drop_course_ids && body.drop_course_ids.length > 0) {
    payload.drop_course_ids = body.drop_course_ids;
  }
  const res = await fetch(
    `${API_BASE}/api/v1/courses/advisory/consult/add-drop`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as AdvisoryRecommendation;
}

/** POST /api/v1/courses/advisory/consult/pre-registration */
export async function consultPreRegistration(
  termId: string
): Promise<AdvisoryRecommendation> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/courses/advisory/consult/pre-registration`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ term_id: termId }),
    }
  );
  const data = await res.json().catch(() => ({}));
  console.log(data);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as AdvisoryRecommendation;
}

export type ScheduleSlot = {
  course_code: string;
  course_title: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  instructor_id?: string;
  instructor_name?: string | null;
  instructor_staff_id?: string | null;
  room?: string;
  course_id?: string;
  source?: string;
  source_section_id?: string;
};

export type SchedulePendingAddition = {
  course_id: string;
  course_code: string;
  course_title: string;
  credit_hours: number;
};

export type ScheduleSection = {
  section_id: string;
  section_code: string;
  department: string;
  semester: number;
  capacity: number;
  enrolled_count: number;
};

export type MyScheduleResponse = {
  term_id: string;
  student_id: string;
  section: ScheduleSection;
  slots: ScheduleSlot[];
  pending_additions: SchedulePendingAddition[];
};

/** GET /api/v1/courses/me/schedule?term_id=... */
export async function fetchMySchedule(
  termId: string
): Promise<MyScheduleResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/courses/me/schedule?term_id=${encodeURIComponent(termId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as MyScheduleResponse;
}

// ── Schedule re-allocation on add/drop ──────────────────────────
// After an officer applies an ADD, the course lands on the
// registration with no timetable slots and shows under
// pending_additions. The student picks a non-conflicting section
// via these two endpoints.

/** One weekly meeting in a candidate section. */
export type ScheduleSlotSummary = {
  slot_id: string;
  course_code: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room?: string;
  instructor_id?: string;
  instructor_name?: string | null;
  instructor_staff_id?: string | null;
};

/** A candidate slot that collides with a slot already on the schedule. */
export type ScheduleConflictDetail = {
  candidate: ScheduleSlotSummary;
  collides_with: ScheduleSlotSummary;
};

/** A section the student could pick for an added course. */
export type ScheduleSectionOption = {
  section_id: string;
  section_code: string;
  department: string;
  semester: number;
  slots: ScheduleSlotSummary[];
  conflicts: ScheduleConflictDetail[];
  /** false when any candidate slot collides with the current schedule. */
  is_viable: boolean;
};

export type ScheduleOptionsCourse = {
  course_id: string;
  course_code?: string;
  course_title?: string;
};

export type ScheduleOptionsResponse = {
  registration_id: string;
  course: ScheduleOptionsCourse;
  options: ScheduleSectionOption[];
};

export type ScheduleAcceptResponse = {
  registration_id: string;
  course_id: string;
  section_id: string;
  slots_created: number;
};

/** GET /api/v1/courses/me/schedule/options-for/{course_id}
 *  Pass the term the student is viewing so options resolve against
 *  the right registration when more than one term is open. */
export async function fetchScheduleOptionsForCourse(
  courseId: string,
  termId?: string
): Promise<ScheduleOptionsResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const qs = termId ? `?term_id=${encodeURIComponent(termId)}` : "";
  const res = await fetch(
    `${API_BASE}/api/v1/courses/me/schedule/options-for/${encodeURIComponent(courseId)}${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as ScheduleOptionsResponse;
}

/** POST /api/v1/courses/me/schedule/accept-for/{course_id}
 *  `termId` must match the term used when options were fetched. */
export async function acceptSectionForCourse(
  courseId: string,
  sectionId: string,
  termId?: string
): Promise<ScheduleAcceptResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const body: { section_id: string; term_id?: string } = { section_id: sectionId };
  if (termId) body.term_id = termId;
  const res = await fetch(
    `${API_BASE}/api/v1/courses/me/schedule/accept-for/${encodeURIComponent(courseId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as ScheduleAcceptResponse;
}

export type RegistrationInvoiceLine = {
  course_id: string;
  course_code: string;
  course_title: string;
  credit_hours: number;
  line_total: number;
};

export type RegistrationInvoice = {
  registration_id: string;
  sponsorship_type: string;
  currency: string;
  fee_per_credit_hour: number;
  lines: RegistrationInvoiceLine[];
  total_credit_hours: number;
  gross_total: number;
  amount_due: number;
  is_government_sponsored: boolean;
  payment_required: boolean;
  note?: string;
};

export type RegistrationPaymentInitiateResponse = {
  registration_id: string;
  payment_reference: string;
  payment_url: string;
};

/** GET /api/v1/courses/registrations/{registration_id}/invoice */
export async function fetchRegistrationInvoice(
  registrationId: string
): Promise<RegistrationInvoice> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/courses/registrations/${encodeURIComponent(registrationId)}/invoice`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as RegistrationInvoice;
}

/** POST /api/v1/courses/registrations/{registration_id}/payment/initiate */
export async function initiateRegistrationPayment(
  registrationId: string
): Promise<RegistrationPaymentInitiateResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/courses/registrations/${encodeURIComponent(registrationId)}/payment/initiate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as RegistrationPaymentInitiateResponse;
}

/** POST /api/v1/courses/registrations/{registration_id}/payment/callback */
export async function callbackRegistrationPayment(
  registrationId: string,
  body: { payment_reference: string }
): Promise<unknown> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/courses/registrations/${encodeURIComponent(registrationId)}/payment/callback`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** POST /api/v1/courses/me/register — submit selected courses for a term. */
export async function registerForCourses(
  termId: string,
  courseIds: string[]
): Promise<unknown> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/me/register`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ term_id: termId, course_ids: courseIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** GET /api/v1/courses/me — requires student Bearer token. */
export async function fetchStudentMe(): Promise<StudentMeResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(`${API_BASE}/api/v1/courses/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  console.log(data)
  if (!res.ok) throw new ApiError(res.status, data);
  return data as StudentMeResponse;
}

export type UndergraduateApplicationRecord = {
  id: string;
  applicant_id: string;
  applicant_email?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  sponsorship_type: string;
  stream: string;
  admission_number: string;
  program_choice_1_id?: string;
  program_choice_2_id?: string;
  program_choice_3_id?: string;
  program_choice_1?: {
    id: string;
    code: string;
    name: string;
  };
  program_choice_2?: {
    id: string;
    code: string;
    name: string;
  };
  program_choice_3?: {
    id: string;
    code: string;
    name: string;
  };
  admission_term: string | { id: string; term_name: string };
  current_status: string;
  final_decision: string;
  payment_status: string;
  payment_reference: string;
  remarks: string;
  extra_data: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  uat_id?: string | null;
};

export type TestingCenterCallbackResponse = {
  uat_id: string;
  score: number;
};

/** GET /api/v1/testing-center/callback/{uat_id} — returns UAT score/message */
export async function fetchTestingCenterCallback(
  uatId: string,
  accessToken?: string | null
): Promise<TestingCenterCallbackResponse> {
  const token = accessToken ?? getStoredAccessToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `${API_BASE}/api/v1/testing-center/records/${encodeURIComponent(uatId)}`,
    { headers }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as TestingCenterCallbackResponse;
}

/** GET /api/v1/undergraduate/applications/{application_id} — requires Bearer token */
export async function fetchUndergraduateApplicationById(
  applicationId: string
): Promise<UndergraduateApplicationRecord> {
  const token = getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  const raw =
    Array.isArray(data) && data.length > 0
      ? data[0]
      : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
        ? (data as { items: unknown[] }).items[0]
        : data;
  if (!raw || typeof raw !== "object") {
    throw new ApiError(500, { detail: "Invalid application response shape." });
  }
  return raw as UndergraduateApplicationRecord;
}

export type EnrollmentRecord = {
  id: string;
  application_id: string;
  applicant_id: string;
  student_full_name?: string | null;
  admission_term_id: string;
  university_id: string;
  program_id?: string | null;
  department: string;
  enrollment_term: string;
  created_at: string;
};

/** GET /api/v1/undergraduate/enrollment/{application_id} — returns null on 404 */
export async function fetchEnrollmentByApplicationId(
  applicationId: string
): Promise<EnrollmentRecord | null> {
  const token = getStoredAccessToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/enrollment/${encodeURIComponent(applicationId)}`,
    { headers }
  );
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as EnrollmentRecord;
}

/** GET /api/v1/undergraduate/applications/me — requires Bearer token */
export async function fetchMyApplications(): Promise<
  UndergraduateApplicationRecord[]
> {
  const token = getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/me`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return Array.isArray(data) ? (data as UndergraduateApplicationRecord[]) : [];
}

export type ProgramItem = {
  id: string;
  code: string;
  name: string;
  department: string;
  stream: string;
  cut_off_score?: number;
  max_capacity?: number;
  is_active?: boolean;
  created_at?: string;
};

export type ProgramsResponse = {
  items: ProgramItem[];
  total: number;
};

export async function fetchPrograms(
  stream: "NATURAL" | "SOCIAL"
): Promise<ProgramItem[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/programs?stream=${encodeURIComponent(stream)}`
  );
  const data = (await res.json().catch(() => ({}))) as ProgramsResponse;
  if (!res.ok) throw new ApiError(res.status, data);
  return Array.isArray(data.items) ? data.items : [];
}

/** GET /api/v1/programs/{program_id} */
export async function fetchProgramById(programId: string): Promise<ProgramItem> {
  const token = getStoredAccessToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(
    `${API_BASE}/api/v1/programs/${encodeURIComponent(programId)}`,
    { headers }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as ProgramItem;
}

export type UndergraduateApplicationRequest = {
  sponsorship_type: string;
  stream: string;
  admission_number: string;
  admission_term_id: string;
  program_choice_1_id: string;
  program_choice_2_id: string;
  program_choice_3_id: string;
  extra_data?: Record<string, unknown>;
};

export async function submitUndergraduateApplication(
  body: UndergraduateApplicationRequest,
  accessToken?: string | null
): Promise<UndergraduateApplicationRecord> {
  const token = accessToken ?? getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, {
      detail: "You must be logged in to submit an application.",
    });
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const rawBody = body as UndergraduateApplicationRequest & {
    admission_term?: unknown;
  };
  const normalizedBody = {
    ...rawBody,
    admission_term_id:
      rawBody.admission_term_id ??
      (typeof rawBody.admission_term === "string" ? rawBody.admission_term : ""),
    extra_data: rawBody.extra_data ?? {},
  };
  delete (normalizedBody as { admission_term?: unknown }).admission_term;

  const res = await fetch(`${API_BASE}/api/v1/undergraduate/applications`, {
    method: "POST",
    headers,
    body: JSON.stringify(normalizedBody),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as UndergraduateApplicationRecord;
}

export type PaymentInitiateResponse = {
  application_id: string;
  payment_reference: string;
  payment_url: string;
  message: string;
};

/** POST /api/v1/undergraduate/applications/{application_id}/payment/initiate */
export async function initiateApplicationPayment(
  applicationId: string,
  accessToken?: string | null
): Promise<PaymentInitiateResponse> {
  const token = accessToken ?? getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/payment/initiate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as PaymentInitiateResponse;
}

export type PaymentCallbackBody = {
  payment_reference: string;
  status: "COMPLETED";
};

export type SubmitCorrectionsBody = {
  admission_number: string;
  first_name: string;
  last_name: string;
  stream: "NATURAL" | "SOCIAL";
};

/** POST /api/v1/undergraduate/applications/{application_id}/payment/callback */
export async function callbackApplicationPayment(
  applicationId: string,
  body: PaymentCallbackBody,
  accessToken?: string | null
): Promise<unknown> {
  const token = accessToken ?? getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/payment/callback`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** POST /api/v1/undergraduate/applications/{application_id}/submit-corrections */
export async function submitApplicationCorrections(
  applicationId: string,
  body: SubmitCorrectionsBody,
  accessToken?: string | null
): Promise<unknown> {
  const token = accessToken ?? getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/submit-corrections`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// /** POST /api/v1/undergraduate/applications/{application_id}/validate */
// export async function validateUndergraduateApplication(
//   applicationId: string,
//   accessToken?: string | null
// ): Promise<unknown> {
//   const token = accessToken ?? getStoredAccessToken();
//   if (!token) {
//     throw new ApiError(401, { detail: "Not authenticated" });
//   }
//   const res = await fetch(
//     `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}`,
//     {
//       method: "POST",
//       headers: { Authorization: `Bearer ${token}` },
//     }
//   );
//   const data = await res.json().catch(() => ({}));
//   if (!res.ok) throw new ApiError(res.status, data);
//   return data;
// }

// /** POST /api/v1/undergraduate/applications/{application_id}/verify-credentials */
// export async function verifyCredentialsUndergraduateApplication(
//   applicationId: string,
//   accessToken?: string | null
// ): Promise<unknown> {
//   const token = accessToken ?? getStoredAccessToken();
//   if (!token) {
//     throw new ApiError(401, { detail: "Not authenticated" });
//   }
//   const res = await fetch(
//     `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/verify-credentials`,
//     {
//       method: "POST",
//       headers: { Authorization: `Bearer ${token}` },
//     }
//   );
//   const data = await res.json().catch(() => ({}));
//   if (!res.ok) throw new ApiError(res.status, data);
//   return data;
// }

export async function fetchTerms(): Promise<admissionTerm[]> {
  const res = await fetch(`${API_BASE}/api/v1/undergraduate/admission-terms/open`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { items?: unknown[] }).items)
      ? (data as { items: unknown[] }).items
      : [];

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
      const termValue =
        typeof r.term_name === "string"
          ? r.term_name
          : r.term_name && typeof r.term_name === "object"
            ? (r.term_name as Record<string, unknown>).term_name
            : "";
      const term_name =
        typeof termValue === "string" ? termValue : String(termValue ?? "");
      if (!id || !term_name) return null;
      return { id, term_name } satisfies admissionTerm;
    })
    .filter((t): t is admissionTerm => t !== null);
}

// ══════════════════════════════════════════════════════════════
//  Grading (Track B) — student transcript
// ══════════════════════════════════════════════════════════════

export type GradeLetter =
  | "A_PLUS" | "A" | "A_MINUS"
  | "B_PLUS" | "B" | "B_MINUS"
  | "C_PLUS" | "C" | "C_MINUS"
  | "D" | "F"
  | "I" | "W" | "NG";

export type TranscriptComponentScore = {
  name: string;
  weight: number;
  max_score: number;
  score: number | null;
  weighted_contribution: number | null;
};

export type TranscriptCourseEntry = {
  course_id: string;
  course_code: string;
  course_title: string;
  credit_hours: number;
  letter_grade: GradeLetter;
  numeric_score: number | null;
  grade_points: number | null;
  has_breakdown: boolean;
  components: TranscriptComponentScore[];
};

export type AcademicStatusType =
  | "PROMOTED"
  | "WARNING"
  | "DISTINCTION"
  | "DISMISSED"
  | "INCOMPLETE";

export type TranscriptTermEntry = {
  term_id: string;
  term_name: string;
  term_phase: string;
  term_start_date: string;
  term_end_date: string;
  courses: TranscriptCourseEntry[];
  term_gpa: number | null;
  total_credit_hours: number;
  /** Track C — null until the department head authorises the term's standing. */
  academic_status: AcademicStatusType | null;
  academic_status_authorised_at: string | null;
};

export type TranscriptResponse = {
  student_id: string;
  student_number: string;
  full_name: string;
  terms: TranscriptTermEntry[];
  cgpa: number | null;
  total_credit_hours_completed: number;
};

/** GET /api/v1/courses/grading/me/transcript — student transcript across every term. */
export async function fetchMyTranscript(): Promise<TranscriptResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) throw new ApiError(401, { detail: "Not authenticated" });
  const res = await fetch(
    `${API_BASE}/api/v1/courses/grading/me/transcript`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as TranscriptResponse;
}

/** GET /api/v1/courses/grading/me/terms/{term_id}/grades — one-term view. */
export async function fetchMyTermGrades(
  termId: string,
): Promise<TranscriptTermEntry> {
  const token = getStoredStudentAccessToken();
  if (!token) throw new ApiError(401, { detail: "Not authenticated" });
  const res = await fetch(
    `${API_BASE}/api/v1/courses/grading/me/terms/${encodeURIComponent(termId)}/grades`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as TranscriptTermEntry;
}

// ── Track C: academic standing (student) ─────────────────────────

export type StudentStandingTerm = {
  id: string;
  term_id: string;
  term_name: string;
  term_phase: string;
  term_start_date: string;
  term_end_date: string;
  status: AcademicStatusType;
  sgpa: number | null;
  cgpa: number | null;
  term_credit_hours: number;
  cumulative_credit_hours: number;
  f_count_term: number;
  authorised_at: string | null;
  explanation: string | null;
};

export type StudentStandingResponse = {
  student_id: string;
  student_number: string;
  full_name: string;
  current_status: AcademicStatusType | null;
  terms: StudentStandingTerm[];
};

/** GET /api/v1/courses/standing/me — every authorised standing, newest-first. */
export async function fetchMyStanding(): Promise<StudentStandingResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) throw new ApiError(401, { detail: "Not authenticated" });
  const res = await fetch(`${API_BASE}/api/v1/courses/standing/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as StudentStandingResponse;
}

// ── Track C: official records (student) ──────────────────────────

export type RecordStudentHeader = {
  student_id: string;
  student_number: string;
  full_name: string;
  department: string;
  current_semester: number;
};

export type RecordTermHeader = {
  term_id: string;
  term_name: string;
  term_phase: string;
  term_start_date: string;
  term_end_date: string;
};

export type GradeReportCourse = {
  course_code: string;
  course_title: string;
  credit_hours: number;
  letter_grade: GradeLetter;
  numeric_score: number | null;
  grade_points: number | null;
};

export type GradeReportResponse = {
  document_id: string;
  generated_at: string;
  student: RecordStudentHeader;
  term: RecordTermHeader;
  courses: GradeReportCourse[];
  term_gpa: number | null;
  cumulative_gpa: number | null;
  term_credit_hours: number;
  cumulative_credit_hours: number;
  academic_status: AcademicStatusType | null;
  academic_status_authorised_at: string | null;
  explanation: string | null;
};

export type FilingSlipCourse = {
  course_code: string;
  course_title: string;
  credit_hours: number;
  is_dropped: boolean;
};

export type FilingSlipResponse = {
  document_id: string;
  generated_at: string;
  student: RecordStudentHeader;
  term: RecordTermHeader;
  registration_status: string;
  sponsorship_type: string;
  section_code: string | null;
  courses: FilingSlipCourse[];
  total_credit_hours: number;
  payment_reference: string | null;
  finalised_at: string | null;
  last_authorised_status: AcademicStatusType | null;
  last_authorised_term_name: string | null;
};

/** GET /api/v1/courses/records/me/grade-report?term_id= — past-term official record. */
export async function fetchGradeReport(termId: string): Promise<GradeReportResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) throw new ApiError(401, { detail: "Not authenticated" });
  const res = await fetch(
    `${API_BASE}/api/v1/courses/records/me/grade-report?term_id=${encodeURIComponent(termId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as GradeReportResponse;
}

/** GET /api/v1/courses/records/me/filing-slip?term_id= — current/upcoming-term slip. */
export async function fetchFilingSlip(termId: string): Promise<FilingSlipResponse> {
  const token = getStoredStudentAccessToken();
  if (!token) throw new ApiError(401, { detail: "Not authenticated" });
  const res = await fetch(
    `${API_BASE}/api/v1/courses/records/me/filing-slip?term_id=${encodeURIComponent(termId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data as FilingSlipResponse;
}

/** Human-readable letter (UI helper — the enum uses underscores for + / -). */
export function formatGradeLetter(letter: GradeLetter): string {
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