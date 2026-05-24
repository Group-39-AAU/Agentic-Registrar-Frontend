"use client";

import { Section } from "@/components/ApiHelpers";
import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  return token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {};
}

type AcademicTerm = {
  id: string;
  term_name: string;
  phase: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  description?: string;
};

type AdmissionTerm = {
  id: string;
  term_name: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  description?: string;
};

type ToggleState = { busy: boolean; error: string | null };

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function StatusPill({ open }: { open: boolean }) {
  return open ? (
    <span className="inline-flex items-center rounded-full border border-[#cae6cf] bg-[#ecf8ef] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1f7a3a]">
      Open
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-600">
      Closed
    </span>
  );
}

async function toggleAt(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail?: unknown }).detail ?? "Request failed")
        : "Request failed";
    throw new Error(`${detail} (HTTP ${res.status})`);
  }
}

export default function OfficerTermsPage() {
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[] | null>(null);
  const [admissionTerms, setAdmissionTerms] = useState<AdmissionTerm[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggleState, setToggleState] = useState<Record<string, ToggleState>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [aRes, uRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/courses/terms`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/v1/undergraduate/admission-terms`, {
          headers: authHeaders(),
        }),
      ]);
      const aJson = await aRes.json().catch(() => []);
      const uJson = await uRes.json().catch(() => []);
      if (!aRes.ok) throw new Error("Could not load academic terms.");
      if (!uRes.ok) throw new Error("Could not load admission terms.");
      setAcademicTerms(Array.isArray(aJson) ? (aJson as AcademicTerm[]) : []);
      setAdmissionTerms(Array.isArray(uJson) ? (uJson as AdmissionTerm[]) : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load terms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function toggleAcademic(t: AcademicTerm) {
    const path = t.is_open
      ? `/api/v1/courses/officer/terms/${encodeURIComponent(t.id)}/close`
      : `/api/v1/courses/officer/terms/${encodeURIComponent(t.id)}/open`;
    setToggleState((s) => ({ ...s, [t.id]: { busy: true, error: null } }));
    try {
      await toggleAt(path);
      await loadAll();
      setToggleState((s) => ({ ...s, [t.id]: { busy: false, error: null } }));
    } catch (e) {
      setToggleState((s) => ({
        ...s,
        [t.id]: { busy: false, error: e instanceof Error ? e.message : "Toggle failed." },
      }));
    }
  }

  async function toggleAdmission(t: AdmissionTerm) {
    const path = t.is_open
      ? `/api/v1/undergraduate/admission-terms/${encodeURIComponent(t.id)}/close`
      : `/api/v1/undergraduate/admission-terms/${encodeURIComponent(t.id)}/open`;
    setToggleState((s) => ({ ...s, [t.id]: { busy: true, error: null } }));
    try {
      await toggleAt(path);
      await loadAll();
      setToggleState((s) => ({ ...s, [t.id]: { busy: false, error: null } }));
    } catch (e) {
      setToggleState((s) => ({
        ...s,
        [t.id]: { busy: false, error: e instanceof Error ? e.message : "Toggle failed." },
      }));
    }
  }

  function ToggleButton({
    isOpen,
    busy,
    onClick,
  }: {
    isOpen: boolean;
    busy: boolean;
    onClick: () => void;
  }) {
    const label = busy ? "…" : isOpen ? "Close" : "Open";
    const cls = isOpen
      ? "bg-[#e04b4b] hover:bg-[#c93f3f]"
      : "bg-[#2f9648] hover:bg-[#28823e]";
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`h-[30px] rounded-md px-3 text-[11px] font-semibold text-white disabled:opacity-60 ${cls}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="aau-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2f76b7]">
          Course Management · Terms
        </p>
        <h1 className="mt-1 text-[26px] font-bold tracking-[-0.01em] text-[#1f2f40] sm:text-[28px]">
          Term Windows
        </h1>
        <p className="mt-2 max-w-[760px] text-[13px] text-[#5a5a5a]">
          Toggle each term&apos;s open/closed state. <b>Course terms</b> control when students can
          register for courses, view their schedule, and run add/drop. <b>Admission terms</b>{" "}
          control whether new applicants can submit applications.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {loadError}
        </p>
      ) : null}

      <Section
        title="Course (academic) terms"
        subtitle="Used by the course-registration, schedule, and add/drop flows."
        action={
          <button
            type="button"
            onClick={() => void loadAll()}
            disabled={loading}
            className="h-[34px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff] disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      >
        {!academicTerms ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading…</p>
        ) : academicTerms.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No academic terms found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {academicTerms.map((t) => {
                  const st = toggleState[t.id] ?? { busy: false, error: null };
                  return (
                    <tr key={t.id} className="border-b border-gray-100 align-top hover:bg-[#eef4ff]/50">
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-[#1f2f40]">
                        {t.term_name}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-[#3a3a3a]">
                        Phase {t.phase}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                        {fmtDate(t.start_date)} → {fmtDate(t.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill open={t.is_open} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <ToggleButton
                            isOpen={t.is_open}
                            busy={st.busy}
                            onClick={() => void toggleAcademic(t)}
                          />
                          {st.error ? (
                            <span className="text-[10.5px] text-[#a31a1a]">{st.error}</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="Admission terms"
        subtitle="Used by the public applicant portal. Closing blocks new application submissions."
      >
        {!admissionTerms ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading…</p>
        ) : admissionTerms.length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No admission terms found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {admissionTerms.map((t) => {
                  const st = toggleState[t.id] ?? { busy: false, error: null };
                  return (
                    <tr key={t.id} className="border-b border-gray-100 align-top hover:bg-[#eef4ff]/50">
                      <td className="px-4 py-3 text-[12.5px] font-semibold text-[#1f2f40]">
                        {t.term_name}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#3a3a3a]">
                        {t.description ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#5a5a5a]">
                        {fmtDate(t.start_date)} → {fmtDate(t.end_date)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill open={t.is_open} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <ToggleButton
                            isOpen={t.is_open}
                            busy={st.busy}
                            onClick={() => void toggleAdmission(t)}
                          />
                          {st.error ? (
                            <span className="text-[10.5px] text-[#a31a1a]">{st.error}</span>
                          ) : null}
                        </div>
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
