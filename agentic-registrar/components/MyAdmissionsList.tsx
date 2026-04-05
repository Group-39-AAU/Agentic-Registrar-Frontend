"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiError,
  clearStoredAccessToken,
  fetchMyApplications,
  getStoredAccessToken,
  type UndergraduateApplicationRecord,
} from "@/lib/api";

export default function MyAdmissionsList() {
  const router = useRouter();
  const [items, setItems] = useState<UndergraduateApplicationRecord[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      setLoading(false);
      setError("not_authenticated");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyApplications();
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError && e.status === 401) {
            setError("session_expired");
          } else {
            setError(
              e instanceof ApiError ? e.message : "Could not load applications."
            );
          }
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-10 rounded-lg border border-gray-200 bg-white px-6 py-12 text-center text-[14px] text-[#5a5a5a]">
        Loading your applications…
      </div>
    );
  }

  if (error === "not_authenticated" || error === "session_expired") {
    return (
      <div className="mt-10 rounded-lg border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <p className="text-[14px] text-[#5a5a5a]">
          {error === "session_expired"
            ? "Your session expired. Please log in again."
            : "Please log in on the home page to see your applications."}
        </p>
        <button
          type="button"
          onClick={() => {
            clearStoredAccessToken();
            router.push("/admissions/login");
          }}
          className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#3f79b5] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#356e9f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f79b5] focus-visible:ring-offset-2"
        >
          Go to login
        </button>
      </div>
    );
  }

  if (error && error !== "not_authenticated" && error !== "session_expired") {
    return (
      <div className="mt-10 rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center text-[14px] text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-10 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[800px] border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
            <th className="px-4 py-3">Admission #</th>
            <th className="px-4 py-3">Term</th>
            <th className="px-4 py-3">Stream</th>
            <th className="px-4 py-3">Sponsorship</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody>
          {(items ?? []).length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-[#5a5a5a]"
              >
                No applications yet.{" "}
                <Link
                  href="/admissions"
                  className="font-semibold text-[#2f76b7] underline"
                >
                  Start an application
                </Link>
                .
              </td>
            </tr>
          ) : (
            (items ?? []).map((row) => (
              <tr
                key={row.id}
                role="link"
                tabIndex={0}
                className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-[#eef4ff]/80"
                onClick={() =>
                  router.push(`/admissions/my-admissions/${row.id}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/admissions/my-admissions/${row.id}`);
                  }
                }}
              >
                <td className="px-4 py-3 font-mono text-[12px] text-[#2f76b7] underline decoration-[#2f76b7]/30 underline-offset-2">
                  {row.admission_number}
                </td>
                <td className="px-4 py-3">{row.admission_term}</td>
                <td className="px-4 py-3">{row.stream}</td>
                <td className="px-4 py-3">{row.sponsorship_type}</td>
                <td className="px-4 py-3">{row.current_status}</td>
                <td className="px-4 py-3">{row.payment_status}</td>
                <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                  {row.updated_at
                    ? new Date(row.updated_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
