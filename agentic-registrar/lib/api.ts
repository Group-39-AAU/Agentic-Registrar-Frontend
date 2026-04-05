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
  sponsorship_type: string;
  stream: string;
  admission_number: string;
  program_choice_1_id: string;
  program_choice_2_id: string;
  program_choice_3_id: string;
  admission_term: string;
  current_status: string;
  final_decision: string;
  payment_status: string;
  payment_reference: string;
  remarks: string;
  extra_data: Record<string, unknown>;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

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
  return data as UndergraduateApplicationRecord;
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
  admission_term: string;
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

  const res = await fetch(`${API_BASE}/api/v1/undergraduate/applications`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...body,
      extra_data: body.extra_data ?? {},
    }),
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

/** POST /api/v1/undergraduate/applications/{application_id}/validate */
export async function validateUndergraduateApplication(
  applicationId: string,
  accessToken?: string | null
): Promise<unknown> {
  const token = accessToken ?? getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/validate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

/** POST /api/v1/undergraduate/applications/{application_id}/verify-credentials */
export async function verifyCredentialsUndergraduateApplication(
  applicationId: string,
  accessToken?: string | null
): Promise<unknown> {
  const token = accessToken ?? getStoredAccessToken();
  if (!token) {
    throw new ApiError(401, { detail: "Not authenticated" });
  }
  const res = await fetch(
    `${API_BASE}/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/verify-credentials`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
