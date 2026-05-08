"use client";

import { Section } from "@/components/ApiHelpers";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ProgramChoice = {
  code?: string;
  name?: string;
};

type FlaggedApplication = {
  id: string;
  applicant_email?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  sponsorship_type?: string;
  stream?: string;
  admission_number?: string;
  program_choice_1?: ProgramChoice | null;
  program_choice_2?: ProgramChoice | null;
  program_choice_3?: ProgramChoice | null;
  current_status?: string;
  payment_status?: string;
  created_at?: string;
  updated_at?: string;
};

type FlagContext = {
  application_id: string;
  current_status?: string;
  latest_ai_recommendation?: string;
  latest_ai_confidence?: number;
  latest_ai_summary?: string;
  traces?: Array<Record<string, unknown>>;
};

type TraceItem = {
  step_name?: string;
  reasoning_log?: string;
};

type RequestState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

const initialState = <T,>(): RequestState<T> => ({
  loading: false,
  error: null,
  data: null,
});

function getAuthHeaders() {
  const token = localStorage.getItem("admin_dashboard_token") ?? "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token.trim()) headers.Authorization = `Bearer ${token.trim()}`;
  return headers;
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

async function requestApi(path: string, method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await parseJson(res);
  if (!res.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail?: unknown }).detail ?? "Request failed")
        : "Request failed";
    throw new Error(`${detail} (HTTP ${res.status})`);
  }
  return payload;
}

export default function FlagsPage() {
  const [queue, setQueue] = useState<RequestState<FlaggedApplication[]>>(initialState);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");
  const [contextState, setContextState] = useState<RequestState<FlagContext>>(initialState);
  const [resolveState, setResolveState] = useState<RequestState<FlaggedApplication>>(initialState);
  const [action, setAction] = useState("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState("");

  const selectedApplication = useMemo(
    () => (queue.data ?? []).find((row) => row.id === selectedApplicationId) ?? null,
    [queue.data, selectedApplicationId]
  );

  const loadQueue = async () => {
    setQueue({ loading: true, error: null, data: null });
    try {
      const payload = await requestApi("/api/v1/undergraduate/applications/flagged-queue", "GET");
      const rows = Array.isArray(payload) ? (payload as FlaggedApplication[]) : [];
      setQueue({ loading: false, error: null, data: rows });
      setSelectedApplicationId((prev) => {
        if (!rows.length) return "";
        if (prev && rows.some((row) => row.id === prev)) return prev;
        return rows[0].id;
      });
    } catch (error) {
      setQueue({
        loading: false,
        error: error instanceof Error ? error.message : "Could not load flagged queue.",
        data: null,
      });
      setSelectedApplicationId("");
    }
  };

  const loadFlagContext = async (applicationId: string) => {
    if (!applicationId) return;
    setContextState({ loading: true, error: null, data: null });
    try {
      const payload = (await requestApi(
        `/api/v1/undergraduate/applications/${encodeURIComponent(applicationId)}/flag-context`,
        "GET"
      )) as FlagContext;
      setContextState({ loading: false, error: null, data: payload });
    } catch (error) {
      setContextState({
        loading: false,
        error: error instanceof Error ? error.message : "Could not load flag context.",
        data: null,
      });
    }
  };

  const resolveFlag = async () => {
    if (!selectedApplicationId) {
      setResolveState({
        loading: false,
        error: "Select an application from the flagged queue.",
        data: null,
      });
      return;
    }
    if (!action.trim()) {
      setResolveState({
        loading: false,
        error: "Action is required.",
        data: null,
      });
      return;
    }
    if (!resolutionNote.trim()) {
      setResolveState({
        loading: false,
        error: "Resolution note is required.",
        data: null,
      });
      return;
    }

    setResolveState({ loading: true, error: null, data: null });
    try {
  
      const payload = (await requestApi(
        `/api/v1/undergraduate/applications/${encodeURIComponent(selectedApplicationId)}/resolve-flag`,
        "POST",
        {
          action: action.trim(),
          resolution_note: resolutionNote.trim(),
        }
      )) as FlaggedApplication;
      setResolveState({ loading: false, error: null, data: payload });
      setResolutionNote("");
      await loadQueue();
    } catch (error) {
      setResolveState({
        loading: false,
        error: error instanceof Error ? error.message : "Could not resolve flag.",
        data: null,
      });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQueue();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedApplicationId) return;
    const timer = window.setTimeout(() => {
      void loadFlagContext(selectedApplicationId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedApplicationId]);

  return (
    <div className="grid items-start gap-5 md:grid-cols-[1fr_1.1fr]">
      <div className="self-start">
        <Section
          title="Flagged Queue"
          subtitle="Applications currently flagged for admin attention"
        >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] text-[#5a5a5a]">
            Total flagged: <span className="font-semibold text-[#2f76b7]">{(queue.data ?? []).length}</span>
          </p>
          <button
            type="button"
            onClick={() => void loadQueue()}
            className="h-[34px] rounded-md border border-[#9bb0cc] bg-white px-3 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#eef4ff]"
          >
            Refresh
          </button>
        </div>

        {queue.loading ? (
          <p className="text-[13px] text-[#5a5a5a]">Loading flagged applications…</p>
        ) : queue.error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {queue.error}
          </p>
        ) : (queue.data ?? []).length === 0 ? (
          <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
            No flagged applications found.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[840px] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  <th className="px-3 py-2">Applicant</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Admission #</th>
                  <th className="px-3 py-2">Sponsorship</th>
                  <th className="px-3 py-2">Stream</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(queue.data ?? []).map((row, index) => {
                  const applicantName =
                    `${row.applicant_first_name ?? ""} ${row.applicant_last_name ?? ""}`.trim() || "—";
                  const selected = row.id === selectedApplicationId;
                  return (
                    <tr
                      key={`${row.id}-${index}`}
                      className={`cursor-pointer border-b border-gray-100 ${
                        selected ? "bg-[#eaf3ff]" : "hover:bg-[#f6faff]"
                      }`}
                      onClick={() => setSelectedApplicationId(row.id)}
                    >
                      <td className="px-3 py-2">{applicantName}</td>
                      <td className="px-3 py-2">{row.applicant_email ?? "—"}</td>
                      <td className="px-3 py-2">{row.admission_number ?? "—"}</td>
                      <td className="px-3 py-2">{row.sponsorship_type ?? "—"}</td>
                      <td className="px-3 py-2">{row.stream ?? "—"}</td>
                      <td className="px-3 py-2">{row.current_status ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </Section>
      </div>

      <div className="self-start">
        <Section
          title="Flag Context & Resolve"
          subtitle="Inspect AI flag context and resolve selected flag"
        >
        {!selectedApplication ? (
          <p className="text-[13px] text-[#5a5a5a]">Select a flagged application to view details.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-3 text-[12px]">
              <p className="font-semibold text-[#1a1a1a]">Selected application</p>
              <p className="mt-1 text-[#5a5a5a]">
                {selectedApplication.applicant_first_name ?? ""} {selectedApplication.applicant_last_name ?? ""}
                {" · "}
                {selectedApplication.admission_number ?? "No admission number"}
              </p>
              <p className="mt-1 text-[#5a5a5a]">
                1st Choice: {selectedApplication.program_choice_1?.code ?? "—"} -{" "}
                {selectedApplication.program_choice_1?.name ?? "—"}
              </p>
            </div>

            {contextState.loading ? (
              <p className="text-[13px] text-[#5a5a5a]">Loading flag context…</p>
            ) : contextState.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {contextState.error}
              </p>
            ) : contextState.data ? (
              <div className="space-y-3">
                <div className="grid gap-2 rounded-md border border-gray-200 bg-white px-3 py-3 text-[12px]">
                  <p>
                    <span className="font-semibold text-[#3a3a3a]">Current Status:</span>{" "}
                    {contextState.data.current_status ?? "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#3a3a3a]">AI Recommendation:</span>{" "}
                    {contextState.data.latest_ai_recommendation ?? "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#3a3a3a]">AI Confidence:</span>{" "}
                    {typeof contextState.data.latest_ai_confidence === "number"
                      ? contextState.data.latest_ai_confidence
                      : "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#3a3a3a]">AI Summary:</span>{" "}
                    {contextState.data.latest_ai_summary ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-[12px] font-semibold text-[#3a3a3a]">Traces</p>
                  {(contextState.data.traces ?? []).length === 0 ? (
                    <p className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-2 text-[12px] text-[#5a5a5a]">
                      No trace details available.
                    </p>
                  ) : (
                    <div className="max-h-[260px] space-y-2 overflow-auto rounded-md border border-gray-200 bg-[#f8fafc] p-2">
                      {(contextState.data.traces as TraceItem[]).map((trace, index) => (
                        <div
                          key={`${trace.step_name ?? "step"}-${index}`}
                          className="rounded-md border border-[#d9e4f2] bg-white px-3 py-2"
                        >
                          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#2f76b7]">
                            {trace.step_name ?? `Step ${index + 1}`}
                          </p>
                          <p className="mt-1 text-[12px] leading-relaxed text-[#1f2937]">
                            {trace.reasoning_log ?? "No reasoning log provided."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="space-y-2 border-t border-gray-200 pt-3">
              <p className="text-[12px] font-semibold text-[#3a3a3a]">Resolve flag</p>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="h-[36px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none"
              >
                <option value="APPROVE_AND_CONTINUE">APPROVE_AND_CONTINUE</option>
                <option value="REQUEST_STUDENT_CORRECTION">REQUEST_STUDENT_CORRECTION</option>
                <option value="ESCALATE_TO_PENDING_REVIEW">ESCALATE_TO_PENDING_REVIEW</option>
                <option value="REJECT_NOW">REJECT_NOW</option>
              </select>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Resolution note (required)"
                rows={3}
                required
                className="w-full resize-y rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 py-2 text-[13px] outline-none"
              />
              <button
                type="button"
                onClick={() => void resolveFlag()}
                disabled={resolveState.loading}
                className="h-[36px] rounded-md bg-[#3f79b5] px-4 text-[13px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
              >
                {resolveState.loading ? "Resolving..." : "Resolve Flag"}
              </button>
              {resolveState.error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {resolveState.error}
                </p>
              ) : null}
              {resolveState.data ? (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700">
                  Flag resolved successfully.
                </p>
              ) : null}
            </div>
          </div>
        )}
        </Section>
      </div>
    </div>
  );
}
