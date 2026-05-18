"use client";

import AdvisoryAddDropPanel from "@/components/AdvisoryAddDropPanel";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import {
  ApiError,
  fetchAddDropPicker,
  submitAddDropBatch,
  type AddDropAction,
  type AddDropPickerResponse,
  type RegistrationCourseRead,
} from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type CourseRow = {
  id: string;
  code: string;
  title: string;
  credit_hours: number;
  reason?: string;
};

function toCourseRow(c: RegistrationCourseRead, reason?: string): CourseRow {
  const inner = c.course ?? ({} as RegistrationCourseRead["course"]);
  return {
    id: c.course_id,
    code: inner.code ?? "",
    title: inner.title ?? "",
    credit_hours: inner.credit_hours ?? 0,
    reason,
  };
}

function CourseChecklist({
  title,
  description,
  tone,
  courses,
  selected,
  onToggle,
  onToggleAll,
  actionLabel,
  onAction,
  emptyLabel,
  busy = false,
  errorMsg = null,
  successMsg = null,
}: {
  title: string;
  description: string;
  tone: "add" | "drop";
  courses: CourseRow[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  actionLabel: string;
  onAction: () => void;
  emptyLabel: string;
  busy?: boolean;
  errorMsg?: string | null;
  successMsg?: string | null;
}) {
  const allSelected = courses.length > 0 && selected.length === courses.length;
  const someSelected = selected.length > 0;

  const palette =
    tone === "add"
      ? {
          icon: "text-[#1f7a3a]",
          iconBg: "bg-[linear-gradient(180deg,#ecf8ef_0%,#dff1e4_100%)]",
          chip: "bg-[#dff1e4] text-[#1f7a3a]",
          accent: "border-[#cae6cf]",
          rowSel: "border-[#a6d7b1] bg-[linear-gradient(180deg,#ecf8ef_0%,#dff1e4_100%)]",
          checked: "border-[#2f9648] bg-[#2f9648]",
          actionGrad: "from-[#3da557] to-[#268040]",
        }
      : {
          icon: "text-[#a31a1a]",
          iconBg: "bg-[linear-gradient(180deg,#fdebeb_0%,#f8d3d3_100%)]",
          chip: "bg-[#fde0e0] text-[#a31a1a]",
          accent: "border-[#f0bcbc]",
          rowSel: "border-[#e9a7a7] bg-[linear-gradient(180deg,#fdebeb_0%,#f8d3d3_100%)]",
          checked: "border-[#c0392b] bg-[#c0392b]",
          actionGrad: "from-[#d04f3f] to-[#a8281a]",
        };

  const totalCredits = courses
    .filter((c) => selected.includes(c.id))
    .reduce((s, c) => s + c.credit_hours, 0);

  return (
    <section className="aau-card overflow-hidden rounded-2xl">
      <div className={`flex items-start justify-between gap-3 border-b ${palette.accent} px-5 py-4`}>
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${palette.iconBg} ${palette.icon}`}>
            {tone === "add" ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-[#1f2f40]">{title}</h2>
            <p className="mt-0.5 text-[12.5px] text-[#5a5a5a]">{description}</p>
          </div>
        </div>
        <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-block ${palette.chip}`}>
          {courses.length} available
        </span>
      </div>

      {courses.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-[#5a5a5a]">{emptyLabel}</p>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-[#3a3a3a]">
              <span
                className={`grid h-4 w-4 place-items-center rounded border transition-colors ${
                  allSelected ? palette.checked + " text-white" : "border-[#9bb0cc] bg-white"
                }`}
              >
                {allSelected ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={allSelected}
                onChange={onToggleAll}
              />
              Select all
            </label>
            <p className="text-[12px] text-[#5a5a5a]">
              <span className="font-semibold text-[#1f2f40]">{selected.length}</span> selected
              {someSelected ? (
                <span className="ml-1 text-[#3a3a3a]">· {totalCredits} cr</span>
              ) : null}
            </p>
          </div>

          <ul className="divide-y divide-gray-100">
            {courses.map((c) => {
              const isSel = selected.includes(c.id);
              return (
                <li key={c.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 px-5 py-3 transition-colors ${
                      isSel ? palette.rowSel : "bg-white hover:bg-[#f6f9fc]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors ${
                        isSel ? palette.checked + " text-white" : "border-[#9bb0cc] bg-white"
                      }`}
                    >
                      {isSel ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSel}
                      onChange={() => onToggle(c.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[14px] font-semibold text-[#1f2f40]">
                          <span className="font-mono text-[#1f5b94]">{c.code}</span>
                          {" · "}
                          {c.title}
                        </p>
                        <span className="text-[12px] font-semibold text-[#3a3a3a]">
                          {c.credit_hours} cr
                        </span>
                      </div>
                      {c.reason ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-[#5a5a5a]">
                          {c.reason}
                        </p>
                      ) : null}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          {errorMsg ? (
            <p className="mx-5 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
              {errorMsg}
            </p>
          ) : null}
          {successMsg ? (
            <p className="mx-5 mt-3 rounded-md border border-[#b6e0bd] bg-[#ecf8ef] px-3 py-2 text-[12px] font-semibold text-[#1f7a3a]">
              {successMsg}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-[#fafbfc] px-5 py-3">
            <p className="text-[11px] italic text-[#5a5a5a]">
              {someSelected
                ? "Tip: open the advisor to validate this plan first."
                : "Pick the courses you want to act on."}
            </p>
            <button
              type="button"
              disabled={!someSelected || busy}
              onClick={onAction}
              className={`rounded-md bg-gradient-to-b ${palette.actionGrad} px-5 py-2 text-[13px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_22px_-10px_rgba(15,23,42,0.5)] transition-all duration-200 enabled:hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none`}
            >
              {busy ? "Submitting…" : actionLabel}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default function CourseAddDropPage() {
  const [picker, setPicker] = useState<AddDropPickerResponse | null>(null);
  const [pickerLoading, setPickerLoading] = useState(true);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [toAdd, setToAdd] = useState<string[]>([]);
  const [toDrop, setToDrop] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setPickerLoading(true);
    setPickerError(null);
    fetchAddDropPicker()
      .then((data) => {
        if (cancelled) return;
        setPicker(data);
        setToAdd([]);
        setToDrop([]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setPickerError(
            "You don't have an active registration in the open term, so there's nothing to add or drop right now.",
          );
        } else if (err instanceof ApiError) {
          setPickerError(
            err.message && err.message !== "Request failed"
              ? `${err.status}: ${err.message}`
              : `Request failed with status ${err.status}`,
          );
        } else if (err instanceof Error) {
          setPickerError(err.message);
        } else {
          setPickerError("Could not load add/drop picker.");
        }
        setPicker(null);
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ADDABLE: CourseRow[] = useMemo(
    () => (picker?.dropped_courses ?? []).map((c) => toCourseRow(c)),
    [picker],
  );
  const DROPPABLE: CourseRow[] = useMemo(
    () =>
      (picker?.active_courses ?? []).map((c) =>
        toCourseRow(c, "In your current registration."),
      ),
    [picker],
  );

  const toggleAdd = (id: string) =>
    setToAdd((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleDrop = (id: string) =>
    setToDrop((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleAllAdd = () =>
    setToAdd((prev) => (prev.length === ADDABLE.length ? [] : ADDABLE.map((c) => c.id)));
  const toggleAllDrop = () =>
    setToDrop((prev) => (prev.length === DROPPABLE.length ? [] : DROPPABLE.map((c) => c.id)));

  const netCredits = useMemo(() => {
    const adding = ADDABLE.filter((c) => toAdd.includes(c.id)).reduce((s, c) => s + c.credit_hours, 0);
    const dropping = DROPPABLE.filter((c) => toDrop.includes(c.id)).reduce((s, c) => s + c.credit_hours, 0);
    return { adding, dropping, net: adding - dropping };
  }, [toAdd, toDrop, ADDABLE, DROPPABLE]);

  const hasSelection = toAdd.length > 0 || toDrop.length > 0;
  const statusLabel = (picker?.registration_status ?? "").replace(/_/g, " ").toLowerCase();

  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [dropBusy, setDropBusy] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  const [dropSuccess, setDropSuccess] = useState<string | null>(null);

  function describeError(err: unknown, fallback: string): string {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        return "No active registration found for this term.";
      }
      return err.message && err.message !== "Request failed"
        ? `${err.status}: ${err.message}`
        : `Request failed with status ${err.status}`;
    }
    if (err instanceof Error) return err.message;
    return fallback;
  }

  async function refreshPicker() {
    try {
      const data = await fetchAddDropPicker();
      setPicker(data);
    } catch {
      // Refresh failures are non-fatal; the success message already showed.
    }
  }

  async function submitBatch(
    courseIds: string[],
    action: AddDropAction,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!picker?.registration_id) {
      return { ok: false, message: "No active registration." };
    }
    if (courseIds.length === 0) {
      return { ok: false, message: "Select at least one course first." };
    }
    try {
      await submitAddDropBatch({
        registration_id: picker.registration_id,
        items: courseIds.map((course_id) => ({ course_id, action })),
      });
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: describeError(err, `Could not ${action.toLowerCase()} the selected courses.`),
      };
    }
  }

  async function handleAdd() {
    if (addBusy) return;
    setAddBusy(true);
    setAddError(null);
    setAddSuccess(null);
    const submitted = toAdd.length;
    const result = await submitBatch(toAdd, "ADD");
    setAddBusy(false);
    if (result.ok) {
      setToAdd([]);
      setAddSuccess(
        `Added ${submitted} course${submitted === 1 ? "" : "s"} successfully.`,
      );
      await refreshPicker();
    } else {
      setAddError(result.message);
    }
  }

  async function handleDrop() {
    if (dropBusy) return;
    setDropBusy(true);
    setDropError(null);
    setDropSuccess(null);
    const submitted = toDrop.length;
    const result = await submitBatch(toDrop, "DROP");
    setDropBusy(false);
    if (result.ok) {
      setToDrop([]);
      setDropSuccess(
        `Dropped ${submitted} course${submitted === 1 ? "" : "s"} successfully.`,
      );
      await refreshPicker();
    } else {
      setDropError(result.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] md:pr-[60px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 md:ml-[40px]">
            <div className="px-3 py-1 text-[16px] md:px-2">
              <div className="md:max-w-[1080px]">
                <h1 className="mb-2 border-b border-[#e0e0e0] pb-2 text-[22px] font-semibold text-[#222] md:text-[24px]">
                  Course Add / Drop
                </h1>

                {picker ? (
                  <div className="aau-card mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 md:px-5">
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      <span className="rounded-full bg-[#eef4fa] px-2.5 py-1 font-semibold text-[#1f5b94]">
                        {picker.term_name}
                      </span>
                      {statusLabel ? (
                        <span className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[#3a3a3a]">
                          {statusLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[12px] italic text-[#5a5a5a]">
                      Registration loaded.
                    </p>
                  </div>
                ) : null}

                {pickerLoading ? (
                  <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#cfddec] bg-[#f6f9fc] py-12">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#cfddec] border-t-[#2f78b7]" />
                    <p className="text-[13px] text-[#5a5a5a]">Loading add / drop picker…</p>
                  </div>
                ) : pickerError ? (
                  <p className="mt-5 rounded-lg border border-[#f0bcbc] bg-[linear-gradient(180deg,#fdebeb_0%,#f8d3d3_100%)] px-4 py-6 text-center text-[14px] font-semibold text-[#a31a1a] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-14px_rgba(163,26,26,0.35)]">
                    {pickerError}
                  </p>
                ) : (
                  <>
                    {/* Summary strip */}
                    <div className="aau-card mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 md:px-5">
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="rounded-full bg-[#dff1e4] px-2.5 py-1 font-semibold text-[#1f7a3a]">
                          +{netCredits.adding} cr to add
                        </span>
                        <span className="rounded-full bg-[#fde0e0] px-2.5 py-1 font-semibold text-[#a31a1a]">
                          −{netCredits.dropping} cr to drop
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${
                            netCredits.net === 0
                              ? "bg-[#eef2f6] text-[#1f5b94]"
                              : netCredits.net > 0
                                ? "bg-[#dff1e4] text-[#1f7a3a]"
                                : "bg-[#fde0e0] text-[#a31a1a]"
                          }`}
                        >
                          Net {netCredits.net >= 0 ? "+" : ""}
                          {netCredits.net} cr
                        </span>
                      </div>
                      <p className="text-[12px] italic text-[#5a5a5a]">
                        {hasSelection
                          ? "Tap the advisor (bottom-right) to check this plan before submitting."
                          : "No changes selected yet."}
                      </p>
                    </div>

                    <div className="mt-5 space-y-5">
                      <CourseChecklist
                        title="Courses you can add"
                        description="Previously dropped courses you can pick back up."
                        tone="add"
                        courses={ADDABLE}
                        selected={toAdd}
                        onToggle={toggleAdd}
                        onToggleAll={toggleAllAdd}
                        actionLabel="Add selected"
                        onAction={handleAdd}
                        emptyLabel="No courses are currently available to add."
                        busy={addBusy}
                        errorMsg={addError}
                        successMsg={addSuccess}
                      />

                      <CourseChecklist
                        title="Courses you can drop"
                        description="These are your currently registered courses."
                        tone="drop"
                        courses={DROPPABLE}
                        selected={toDrop}
                        onToggle={toggleDrop}
                        onToggleAll={toggleAllDrop}
                        actionLabel="Drop selected"
                        onAction={handleDrop}
                        emptyLabel="You don't have any droppable courses."
                        busy={dropBusy}
                        errorMsg={dropError}
                        successMsg={dropSuccess}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      <AdvisoryAddDropPanel
        addCandidates={ADDABLE.map(({ id, code, title, credit_hours }) => ({
          id,
          code,
          title,
          credit_hours,
        }))}
        dropCandidates={DROPPABLE.map(({ id, code, title, credit_hours }) => ({
          id,
          code,
          title,
          credit_hours,
        }))}
        initialAddIds={toAdd}
        initialDropIds={toDrop}
      />

      <PortalFooter />
    </div>
  );
}
