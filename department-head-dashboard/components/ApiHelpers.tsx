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

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const confirmStyles =
    tone === "danger"
      ? "bg-[#c0392b] hover:bg-[#a8311f] focus-visible:ring-[#c0392b]/40"
      : "bg-[#2f78b7] hover:bg-[#266595] focus-visible:ring-[#2f78b7]/40";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-[2px]"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <div
        className="aau-card w-full max-w-[460px] rounded-2xl bg-white p-6 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="text-[18px] font-bold tracking-[-0.01em] text-[#1f2f40]"
        >
          {title}
        </h2>
        <div className="mt-2 text-[13.5px] leading-relaxed text-[#3a3a3a]">
          {description}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-[40px] items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-[13px] font-semibold text-[#1f2f40] hover:bg-[#f8fafc] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex h-[40px] items-center justify-center rounded-md px-5 text-[13px] font-semibold text-white shadow-[0_8px_16px_-8px_rgba(0,0,0,0.3)] focus:outline-none focus-visible:ring-2 ${confirmStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
