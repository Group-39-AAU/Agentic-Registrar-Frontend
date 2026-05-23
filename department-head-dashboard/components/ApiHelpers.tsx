"use client";

export type RequestState = {
  loading: boolean;
  error: string | null;
  data: unknown;
};

export const initialState: RequestState = {
  loading: false,
  error: null,
  data: null,
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function callApi(
  setter: (state: RequestState) => void,
  path: string,
  method: "GET" | "POST",
  body?: unknown
) {
  setter({ loading: true, error: null, data: null });
  try {
    const token = localStorage.getItem("admin_dashboard_token") ?? "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg =
        (data && typeof data === "object" && "detail" in data
          ? String((data as { detail?: unknown }).detail ?? "Request failed")
          : "Request failed") + ` (HTTP ${res.status})`;
      throw new Error(msg);
    }
    setter({ loading: false, error: null, data });
  } catch (error) {
    setter({
      loading: false,
      error: error instanceof Error ? error.message : "Request failed",
      data: null,
    });
  }
}

export function JsonResult({ state }: { state: RequestState }) {
  if (state.loading) return <p className="text-[13px] text-[#5a5a5a]">Loading…</p>;
  if (state.error) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
        {state.error}
      </p>
    );
  }
  if (!state.data) return null;
  return (
    <pre className="max-h-[380px] overflow-auto rounded-md border border-gray-200 bg-[#f8fafc] p-3 text-[11px] text-[#2a2a2a]">
      {JSON.stringify(state.data, null, 2)}
    </pre>
  );
}

export function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="aau-card rounded-2xl p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.01em] text-[#1a1a1a]">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-[#5a5a5a]">{subtitle}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
