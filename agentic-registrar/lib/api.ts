import { admissionTerm } from "./types";

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

export const AUTH_TOKEN_KEY = "aau_registrar_access_token";

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