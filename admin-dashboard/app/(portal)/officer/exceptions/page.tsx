"use client";

import { Section } from "@/components/ApiHelpers";
import { usePageTitle } from "@/components/usePageTitle";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

type ExceptionSource = "ADVISORY" | "GRADING" | "STANDING";

type ExceptionEntry = {
  source: ExceptionSource;
  source_id: string;
  student_id: string | null;
  student_number: string | null;
  full_name: string | null;
  term_id: string | null;
  term_name: string | null;
  department: string | null;
  summary: string;
  deep_link: string;
  created_at: string;
};

const ALL_SOURCES: ExceptionSource[] = ["ADVISORY", "GRADING", "STANDING"];

const SOURCE_META: Record<ExceptionSource, { label: string; cls: string; hint: string }> = {
  ADVISORY: {
    label: "Advisory",
    cls: "border-[#c9b3e6] bg-[#f3edfb] text-[#5f3aa0]",
    hint: "Open HIGH-risk advisory verdict awaiting review.",
  },
  GRADING: {
    label: "Grading",
    cls: "border-[#f0d9a0] bg-[#fff7e2] text-[#8a5a00]",
    hint: "Flagged grade batch awaiting department-head review.",
  },
  STANDING: {
    label: "Standing",
    cls: "border-[#cfddec] bg-[#eef4fa] text-[#1f5b94]",
    hint: "Academic standing held for review.",
  },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/**
 * Map a backend deep_link (relative API path under /api/v1) to a
 * client-side route in THIS app where one exists. Only GRADING batches
 * have an in-app resolution screen here (/officer/grading/{id});
 * STANDING + ADVISORY resolve in the Department-Head console, so we
 * surface the reference path instead of a dead link.
 */
function resolveClientRoute(entry: ExceptionEntry): string | null {
  if (entry.source === "GRADING") {
    const m = entry.deep_link.match(/\/grading\/officer\/batches\/([^/]+)/);
    if (m) return `/officer/grading/${m[1]}`;
  }
  return null;
}

export default function OfficerExceptionQueuePage() {
  usePageTitle("Exception Queue");
  const router = useRouter();
  const [entries, setEntries] = useState<ExceptionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Set<ExceptionSource>>(new Set(ALL_SOURCES));

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/v1/courses/exceptions/queue`);
      // Only send `sources` when narrowed; sending all is equivalent to none.
      if (sources.size > 0 && sources.size < ALL_SOURCES.length) {
        sources.forEach((s) => url.searchParams.append("sources", s));
      }
      const res = await fetch(url.toString(), { headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: unknown }).detail ?? "Request failed")
            : "Could not load the exception queue.";
        throw new Error(`${detail} (HTTP ${res.status})`);
      }
      setEntries(Array.isArray(data) ? (data as ExceptionEntry[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the exception queue.");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [sources]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  function toggleSource(s: ExceptionSource) {
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      // Never allow an empty set — reset to all.
      return next.size === 0 ? new Set(ALL_SOURCES) : next;
    });
  }

  const countsBySource = ALL_SOURCES.map((s) => ({
    source: s,
    count: entries.filter((e) => e.source === s).length,
  }));

  return (
    <div className="space-y-6">
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2f76b7]">
          Course Management · Exceptions
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
          Unified Exception Queue
        </h1>
        <p className="mt-2 max-w-[760px] text-[13px] text-[#5a5a5a]">
          Pending exceptions across advisory verdicts, flagged grade batches, and academic
          standings held for review — one triage list. Resolving the underlying item removes
          its row on the next refresh.
        </p>
      </div>

      <Section
        title="Pending exceptions"
        subtitle="Newest first. Filter by source; click a grading row to open its review screen."
        action={
          <button
            type="button"
            onClick={() => void loadQueue()}
            disabled={loading}
            className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {ALL_SOURCES.map((s) => {
            const active = sources.has(s);
            const meta = SOURCE_META[s];
            const count = countsBySource.find((c) => c.source === s)?.count ?? 0;
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSource(s)}
                title={meta.hint}
                className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${
                  active ? meta.cls : "border-gray-200 bg-gray-50 text-gray-400"
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        ) : loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading queue…</p>
        ) : entries.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No pending exceptions — the queue is clear.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Raised</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const meta = SOURCE_META[e.source];
                  const route = resolveClientRoute(e);
                  return (
                    <tr
                      key={`${e.source}-${e.source_id}`}
                      className="border-b border-gray-100 align-top hover:bg-[#eef4ff]/60"
                    >
                      <td className="px-4 py-3">
                        <span
                          title={meta.hint}
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {e.full_name ? (
                          <>
                            <div className="text-[12.5px] font-semibold text-[#1f2f40]">
                              {e.full_name}
                            </div>
                            <div className="font-mono text-[11.5px] text-[#5a5a5a]">
                              {e.student_number ?? "—"}
                            </div>
                          </>
                        ) : (
                          <span className="text-[12px] italic text-[#5a5a5a]">
                            Section-level
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-[#3a3a3a]">
                        {e.term_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-[#3a3a3a]">
                        {e.department ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-[#1f2f40]">{e.summary}</td>
                      <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                        {formatDateTime(e.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {route ? (
                          <button
                            type="button"
                            onClick={() => router.push(route)}
                            className="h-[30px] rounded-md bg-[#3f79b5] px-3 text-[11px] font-semibold text-white hover:bg-[#356e9f]"
                          >
                            Review
                          </button>
                        ) : (
                          <span
                            className="font-mono text-[11px] text-[#8a8a8a]"
                            title="Resolve in the Department-Head console."
                          >
                            {e.deep_link}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
