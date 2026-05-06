"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function AdminReviewDetailClient({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("admin_dashboard_token") ?? "";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
        const res = await fetch(
          `${API_BASE}/api/v1/undergraduate/review/students/${encodeURIComponent(applicationId)}`,
          { headers }
        );
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            payload && typeof payload === "object" && "detail" in payload
              ? String((payload as { detail?: unknown }).detail ?? "Could not load review detail.")
              : "Could not load review detail."
          );
        }
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load review detail.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  return (
    <div className="space-y-4">
      <p>
        <Link
          href="/review"
          className="text-[13px] font-medium text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
        >
          ← Back to Review Queue
        </Link>
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-[#fafbfc] px-8 py-4">
          <h2 className="text-[18px] font-bold text-[#2a66a7]">Student Review Detail</h2>
          <p className="mt-1 text-[12px] text-[#5a5a5a]">Application ID: {applicationId}</p>
        </div>

        <div className="px-8 py-6">
          {loading ? <p className="text-[13px] text-[#5a5a5a]">Loading detail…</p> : null}
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </p>
          ) : null}
          {!loading && !error ? (
            <pre className="max-h-[520px] overflow-auto rounded-md border border-gray-200 bg-[#f8fafc] p-3 text-[11px] text-[#2a2a2a]">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
