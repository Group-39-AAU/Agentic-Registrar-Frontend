"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ASSESSMENT_OPTIONS, labelForComponentId } from "@/lib/assessmentOptions";
import type { ExcelImportResult } from "@/lib/excelGradeImport";
import {
  excelImportHasAnyIssue,
  expectedExcelHeaders,
  parseGradeExcelWorkbook,
  readExcelWorkbookFromArrayBuffer,
} from "@/lib/excelGradeImport";
import type { CourseStudent, TeacherCourse } from "@/lib/mockCourses";
import { calendarSemesterLabel, getStaticCourseById, parseCalendarSemesterId } from "@/lib/mockCourses";
import { getSubmission, newSubmissionId, upsertSubmission } from "@/lib/submissionsStorage";
import { fetchStudentsForCourse, fetchTeacherCourses, submitGradeMatrix } from "@/lib/teacherApi";

type Step = 1 | 2;

function sortComponentIds(ids: string[]) {
  const order = new Map(ASSESSMENT_OPTIONS.map((o, i) => [o.id, i]));
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

export default function GradeEnterClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseParam = searchParams.get("course");
  const submissionParam = searchParams.get("submission");
  const yearParam = searchParams.get("year");
  const legacyTerm = searchParams.get("term");
  const semesterParam =
    parseCalendarSemesterId(searchParams.get("semester")) ??
    (legacyTerm === "I" || legacyTerm === "i" ? ("1" as const) : legacyTerm === "II" || legacyTerm === "ii" ? ("2" as const) : null);

  const [step, setStep] = useState<Step>(1);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [scores, setScores] = useState<Record<string, Record<string, string>>>({});
  const [submissionId, setSubmissionId] = useState(newSubmissionId);

  const [loadMsg, setLoadMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [excelImport, setExcelImport] = useState<ExcelImportResult | null>(null);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId) ?? null, [courses, courseId]);
  const editingSubmission = Boolean(submissionParam);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (submissionParam) {
        const sub = getSubmission(submissionParam);
        const c = sub ? getStaticCourseById(sub.courseId) : undefined;
        if (!cancelled) setCourses(c ? [c] : []);
        return;
      }
      if (!yearParam || !semesterParam) {
        if (!cancelled) setCourses([]);
        return;
      }
      const list = await fetchTeacherCourses(yearParam, semesterParam);
      if (!cancelled) setCourses(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionParam, yearParam, semesterParam]);

  useEffect(() => {
    if (!courseParam) return;
    if (courses.some((c) => c.id === courseParam)) {
      setCourseId(courseParam);
    }
  }, [courseParam, courses]);

  useEffect(() => {
    if (!submissionParam) {
      setLoadMsg(null);
      return;
    }
    const sub = getSubmission(submissionParam);
    if (!sub) {
      setLoadMsg("That submission could not be found on this device.");
      return;
    }
    setLoadMsg(null);
    setSubmissionId(sub.id);
    setCourseId(sub.courseId);
    setSelectedComponents(sub.components);
    setStep(2);
    const sc: Record<string, Record<string, string>> = {};
    for (const row of sub.rows) {
      sc[row.studentId] = { ...row.scores };
    }
    setScores(sc);
    setAiFeedback(sub.status === "REJECTED" ? sub.aiFeedback ?? null : null);
    setReasoning("");
    setBanner(null);
    setExcelImport(null);
    setExcelFileName(null);
  }, [submissionParam]);

  useEffect(() => {
    if (step !== 2 || !courseId) return;
    let cancelled = false;
    (async () => {
      const roster = await fetchStudentsForCourse(courseId);
      if (cancelled) return;
      setStudents(roster);
      setExcelImport(null);
      setExcelFileName(null);
      setScores((prev) => {
        const next: Record<string, Record<string, string>> = {};
        for (const s of roster) {
          next[s.id] = {};
          for (const comp of selectedComponents) {
            next[s.id][comp] = prev[s.id]?.[comp] ?? "";
          }
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [step, courseId, selectedComponents]);

  function toggleComponent(id: string) {
    setSelectedComponents((prev) => {
      const has = prev.includes(id);
      const merged = has ? prev.filter((x) => x !== id) : [...prev, id];
      return sortComponentIds(merged);
    });
  }

  function goNext() {
    if (!courseId || selectedComponents.length === 0) return;
    setStep(2);
    setBanner(null);
    setExcelImport(null);
    setExcelFileName(null);
    if (!editingSubmission) {
      setAiFeedback(null);
      setReasoning("");
    }
  }

  async function handleExcelFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || students.length === 0 || selectedComponents.length === 0) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = readExcelWorkbookFromArrayBuffer(buf);
      const result = parseGradeExcelWorkbook(wb, students, selectedComponents);
      setExcelFileName(file.name);
      setExcelImport(result);
    } catch (err) {
      setExcelFileName(file.name);
      setExcelImport({
        rows: [],
        summary: { dataRows: 0, matchedRows: 0, unmatchedRows: 0, rowsWithCellIssues: 0 },
        errors: [err instanceof Error ? err.message : "Could not read that Excel file."],
      });
    }
  }

  function discardExcelImport() {
    setExcelImport(null);
    setExcelFileName(null);
  }

  function applyExcelImport() {
    if (!excelImport || excelImportHasAnyIssue(excelImport)) return;
    setScores((prev) => {
      const next = { ...prev };
      for (const row of excelImport.rows) {
        if (!row.rosterStudentId) continue;
        const sid = row.rosterStudentId;
        if (!next[sid]) next[sid] = {};
        for (const cid of selectedComponents) {
          const raw = (row.scores[cid] ?? "").trim();
          if (row.cellIssues[cid]) continue;
          if (raw === "") continue;
          next[sid] = { ...next[sid], [cid]: raw };
        }
      }
      return next;
    });
    setExcelImport(null);
    setExcelFileName(null);
    setBanner("Excel marks merged into the grid below. Review cells, then submit.");
  }

  function goBack() {
    if (editingSubmission) return;
    setExcelImport(null);
    setExcelFileName(null);
    setStep(1);
  }

  async function handleSubmit() {
    if (!selectedCourse) return;
    setBusy(true);
    setBanner(null);
    try {
      const rows = students.map((s) => ({
        studentId: s.id,
        admissionNumber: s.admissionNumber,
        fullName: s.fullName,
        scores: selectedComponents.reduce<Record<string, string>>((acc, comp) => {
          acc[comp] = scores[s.id]?.[comp] ?? "";
          return acc;
        }, {}),
      }));

      const result = await submitGradeMatrix({
        submissionId,
        courseId,
        components: selectedComponents,
        rows,
        reasoning: reasoning.trim() || undefined,
      });

      const now = new Date().toISOString();
      const existing = getSubmission(submissionId);
      const reasoningHistory = [...(existing?.reasoningHistory ?? [])];
      if (reasoning.trim()) {
        reasoningHistory.push({ at: now, text: reasoning.trim() });
      }

      const baseRecord = {
        id: submissionId,
        courseId,
        courseCode: selectedCourse.code,
        courseTitle: selectedCourse.title,
        academicYear: selectedCourse.academicYear,
        calendarSemester: selectedCourse.calendarSemester,
        components: selectedComponents,
        rows: rows.map((r) => ({
          studentId: r.studentId,
          admissionNumber: r.admissionNumber,
          fullName: r.fullName,
          scores: r.scores,
        })),
        reasoningHistory,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      if (result.outcome === "REJECTED") {
        setAiFeedback(result.feedback);
        upsertSubmission({
          ...baseRecord,
          status: "REJECTED",
          aiFeedback: result.feedback,
        });
        setReasoning("");
      } else {
        setAiFeedback(null);
        upsertSubmission({
          ...baseRecord,
          status: "ACCEPTED",
          aiFeedback: undefined,
        });
        setReasoning("");
        setBanner(result.message ?? "Submission accepted. You can review it under Submissions.");
      }
    } finally {
      setBusy(false);
    }
  }

  function startFresh() {
    const y = searchParams.get("year");
    const sem =
      parseCalendarSemesterId(searchParams.get("semester")) ??
      (legacyTerm === "I" || legacyTerm === "i" ? "1" : legacyTerm === "II" || legacyTerm === "ii" ? "2" : null);
    const qs = y && sem ? `?year=${encodeURIComponent(y)}&semester=${encodeURIComponent(sem)}` : "";
    router.push(`/grades/enter${qs}`);
    setStep(1);
    setCourseId("");
    setSelectedComponents([]);
    setStudents([]);
    setScores({});
    setSubmissionId(newSubmissionId());
    setAiFeedback(null);
    setReasoning("");
    setBanner(null);
    setLoadMsg(null);
    setExcelImport(null);
    setExcelFileName(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-[22px] font-bold text-[#2a66a7]">Enter grades</h1>
          <p className="mt-2 max-w-[760px] text-[14px] leading-relaxed text-[#4a5568]">
            Step {step} of 2 — courses and rosters are generated in the browser (large lists for UI testing). Pick
            assessment columns, enter marks, then submit. A simulated policy assistant may reject the batch until you
            add sufficient reasoning.
          </p>
        </div>
        <button
          type="button"
          onClick={startFresh}
          className="h-[38px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#f8fafc]"
        >
          New submission
        </button>
      </div>

      {loadMsg ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          {loadMsg}{" "}
          <Link href="/submissions" className="font-semibold text-[#2f76b7] underline">
            View submissions
          </Link>
        </p>
      ) : null}

      {banner ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-900">
          <span>{banner}</span>{" "}
          <Link href="/submissions" className="font-semibold text-[#2f76b7] underline">
            Open submissions
          </Link>
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
          <span
            className={`rounded-full px-3 py-1 ${step === 1 ? "bg-[#2f76b7] text-white" : "bg-[#e8eef5] text-[#5a5a5a]"}`}
          >
            1 · Components
          </span>
          <span className="text-gray-300">→</span>
          <span
            className={`rounded-full px-3 py-1 ${step === 2 ? "bg-[#2f76b7] text-white" : "bg-[#e8eef5] text-[#5a5a5a]"}`}
          >
            2 · Roster grid
          </span>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            {!submissionParam && (!yearParam || !semesterParam) ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
                Select <strong>academic year</strong> and <strong>calendar semester</strong> on{" "}
                <Link href="/courses" className="font-semibold text-[#2f76b7] underline">
                  My courses
                </Link>{" "}
                before choosing a section here (or add{" "}
                <span className="font-mono text-[12px]">?year=2025/26&amp;semester=1</span> to the URL).
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="h-[42px] w-full max-w-[480px] rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2f76b7]"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title} · {c.academicYear} · {calendarSemesterLabel(c.calendarSemester)}
                    {c.section ? ` · Sec ${c.section}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <label className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                  Assessment components
                </label>
                <span className="text-[11px] text-[#6b7280]">Pick every column you need in the grade sheet.</span>
              </div>
              <div className="grid max-h-[420px] grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-gray-100 bg-[#f8fafc] p-3 sm:grid-cols-2 lg:grid-cols-3">
                {ASSESSMENT_OPTIONS.map((opt) => {
                  const checked = selectedComponents.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[13px] ${
                        checked ? "border-[#2f76b7] bg-white shadow-sm" : "border-transparent bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleComponent(opt.id)}
                        className="h-4 w-4 accent-[#2f76b7]"
                      />
                      <span className="font-medium text-[#1a1a1a]">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!courseId || selectedComponents.length === 0}
                onClick={goNext}
                className="h-[40px] rounded-md bg-[#3f79b5] px-6 text-[14px] font-semibold text-white hover:bg-[#356e9f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next · Build roster table
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-wide text-[#5a5a5a]">Course</div>
                <div className="text-[16px] font-bold text-[#1a1a1a]">
                  {selectedCourse
                    ? `${selectedCourse.code} · ${selectedCourse.title} · ${selectedCourse.academicYear} · ${calendarSemesterLabel(selectedCourse.calendarSemester)}`
                    : "—"}
                </div>
                <div className="mt-1 text-[12px] text-[#6b7280]">
                  {students.length > 0 ? (
                    <span className="tabular-nums">{students.length} students · </span>
                  ) : null}
                  Columns: {selectedComponents.map((c) => labelForComponentId(c)).join(", ")}
                </div>
              </div>
              {!editingSubmission ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="h-[36px] rounded-md border border-[#9bb0cc] bg-white px-4 text-[12px] font-semibold text-[#2f76b7] hover:bg-[#f8fafc]"
                >
                  Back
                </button>
              ) : null}
            </div>

            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={handleExcelFileChange}
            />

            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[#9bb0cc] bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={students.length === 0 || selectedComponents.length === 0}
                  onClick={() => excelInputRef.current?.click()}
                  className="h-[38px] rounded-md border border-[#2f76b7] bg-white px-4 text-[13px] font-semibold text-[#2f76b7] hover:bg-[#eef6ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Import from Excel
                </button>
                {excelImport ? (
                  <button
                    type="button"
                    onClick={discardExcelImport}
                    className="h-[38px] rounded-md border border-gray-300 bg-white px-4 text-[13px] font-semibold text-[#4b5563] hover:bg-gray-50"
                  >
                    Discard import
                  </button>
                ) : null}
              </div>
              <p className="text-[12px] leading-relaxed text-[#5a5a5a]">
                Row 1 must be headers. Required: an admission column (e.g. &quot;Admission Number&quot;) and one column
                per selected assessment, titled exactly like the labels below (e.g. &quot;Quiz 1&quot;). Optional:
                &quot;Full Name&quot;.
              </p>
              <p className="text-[11px] font-mono text-[#374151]">
                {expectedExcelHeaders(selectedComponents).join(" · ")}
              </p>
            </div>

            {excelImport && excelFileName ? (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-[14px] font-bold text-[#1a1a1a]">Import preview</div>
                  <div className="text-[12px] text-[#6b7280]">{excelFileName}</div>
                </div>

                {excelImport.errors.length > 0 ? (
                  <ul className="list-inside list-disc rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
                    {excelImport.errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                ) : null}

                {excelImport.rows.length > 0 ? (
                  <>
                    <p className="text-[12px] text-[#4b5568]">
                      {excelImport.summary.dataRows} row(s) · {excelImport.summary.matchedRows} matched roster ·{" "}
                      {excelImport.summary.unmatchedRows} not on roster · {excelImport.summary.rowsWithCellIssues}{" "}
                      row(s) with invalid numbers
                    </p>
                    <div className="max-h-[min(50vh,420px)] overflow-auto rounded-md border border-gray-200">
                      <table className="w-full min-w-[640px] border-collapse text-left text-[12px]">
                        <thead className="sticky top-0 z-10 bg-[#f0f4fa] text-[10px] font-semibold uppercase tracking-wide text-[#4b5563]">
                          <tr>
                            <th className="border-b border-gray-200 px-2 py-2">#</th>
                            <th className="border-b border-gray-200 px-2 py-2">Admission</th>
                            <th className="border-b border-gray-200 px-2 py-2">Name</th>
                            {selectedComponents.map((cid) => (
                              <th key={cid} className="border-b border-gray-200 px-2 py-2 whitespace-nowrap">
                                {labelForComponentId(cid)}
                              </th>
                            ))}
                            <th className="border-b border-gray-200 px-2 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {excelImport.rows.map((row, idx) => {
                            const statusParts: string[] = [...row.rowIssues];
                            for (const cid of selectedComponents) {
                              const ci = row.cellIssues[cid];
                              if (ci) statusParts.push(`${labelForComponentId(cid)}: ${ci}`);
                            }
                            const ok = row.rosterStudentId && statusParts.length === 0;
                            return (
                              <tr key={`excel-preview-${idx}`} className="border-b border-gray-100">
                                <td className="px-2 py-1.5 text-[#6b7280]">{row.sheetRow}</td>
                                <td className="px-2 py-1.5 font-medium">{row.admissionNumber}</td>
                                <td className="px-2 py-1.5 text-[#4b5568]">{row.fullName || "—"}</td>
                                {selectedComponents.map((cid) => {
                                  const v = row.scores[cid] ?? "";
                                  const bad = Boolean(row.cellIssues[cid]);
                                  return (
                                    <td
                                      key={cid}
                                      className={`px-2 py-1.5 tabular-nums ${bad ? "bg-red-50 text-red-800" : ""}`}
                                    >
                                      {v || "—"}
                                    </td>
                                  );
                                })}
                                <td className="px-2 py-1.5">
                                  {ok ? (
                                    <span className="text-emerald-700">OK</span>
                                  ) : (
                                    <span className="text-red-700">{statusParts.join("; ") || "—"}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={excelImportHasAnyIssue(excelImport)}
                        onClick={applyExcelImport}
                        className="h-[40px] rounded-md bg-[#2f76b7] px-5 text-[13px] font-semibold text-white hover:bg-[#265f96] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Apply to grade sheet
                      </button>
                      <button
                        type="button"
                        onClick={discardExcelImport}
                        className="h-[40px] rounded-md border border-gray-300 bg-white px-5 text-[13px] font-semibold text-[#4b5563] hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="max-h-[min(75vh,680px)] overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-[720px] w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f0f4fa] text-left text-[11px] font-semibold uppercase tracking-wide text-[#4b5563] shadow-sm">
                    <th className="sticky top-0 left-0 z-40 border-b border-r border-gray-200 bg-[#f0f4fa] px-3 py-2 shadow-sm">
                      Student
                    </th>
                    <th className="sticky top-0 z-20 border-b border-gray-200 bg-[#f0f4fa] px-3 py-2">ID</th>
                    {selectedComponents.map((cid) => (
                      <th
                        key={cid}
                        className="sticky top-0 z-20 border-b border-gray-200 bg-[#f0f4fa] px-2 py-2 whitespace-nowrap"
                      >
                        {labelForComponentId(cid)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 last:border-0">
                      <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-3 py-2 font-medium text-[#1a1a1a] shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        {s.fullName}
                      </td>
                      <td className="px-3 py-2 text-[#5a5a5a]">{s.admissionNumber}</td>
                      {selectedComponents.map((cid) => (
                        <td key={cid} className="px-2 py-1">
                          <input
                            value={scores[s.id]?.[cid] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setScores((prev) => ({
                                ...prev,
                                [s.id]: { ...(prev[s.id] ?? {}), [cid]: v },
                              }));
                            }}
                            inputMode="decimal"
                            placeholder="—"
                            className="h-[34px] w-[88px] rounded border border-[#c9d5e8] bg-[#fbfcff] px-2 text-[13px] outline-none focus:border-[#2f76b7]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {aiFeedback ? (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-amber-900">
                  Assistant review · action required
                </div>
                <p className="text-[13px] leading-relaxed text-amber-950">{aiFeedback}</p>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-[#5a3b00]">
                    Your reasoning for the registrar
                  </label>
                  <textarea
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                    rows={5}
                    placeholder="Explain marking criteria, weighting, verification steps, and any exceptions for this cohort."
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-[#b45309]"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy || students.length === 0}
                onClick={handleSubmit}
                className="h-[40px] rounded-md bg-[#3f79b5] px-6 text-[14px] font-semibold text-white hover:bg-[#356e9f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Submitting…" : aiFeedback ? "Resubmit with reasoning" : "Submit for review"}
              </button>
              <Link href="/submissions" className="text-[13px] font-semibold text-[#2f76b7] hover:underline">
                View submission history
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
