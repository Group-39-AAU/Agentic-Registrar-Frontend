import * as XLSX from "xlsx";
import { labelForComponentId } from "./assessmentOptions";
import type { CourseStudent } from "./mockCourses";

export type ExcelPreviewRow = {
  /** 1-based row index in the sheet (including header as row 1). */
  sheetRow: number;
  admissionNumber: string;
  fullName: string;
  scores: Record<string, string>;
  cellIssues: Partial<Record<string, string>>;
  rowIssues: string[];
  rosterStudentId: string | null;
};

export type ExcelImportResult = {
  rows: ExcelPreviewRow[];
  summary: {
    dataRows: number;
    matchedRows: number;
    unmatchedRows: number;
    rowsWithCellIssues: number;
  };
  /** Blocking problems (e.g. missing required columns). */
  errors: string[];
};

function normHeader(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeAdmissionKey(s: string): string {
  return s.replace(/\s+/g, "").toUpperCase();
}

function isBlankScore(s: string): boolean {
  return s.trim() === "";
}

function isValidScoreToken(s: string): boolean {
  const t = s.trim();
  if (t === "") return true;
  return /^-?\d+(\.\d+)?$/.test(t);
}

const ADMISSION_HEADER_MATCHERS = [
  "admission number",
  "admission no",
  "admission",
  "admissionno",
  "student id",
  "id number",
  "ets id",
];

const NAME_HEADER_MATCHERS = ["full name", "student name", "name"];

function findAdmissionColumn(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const n = normHeader(headers[i]);
    if (!n) continue;
    if (ADMISSION_HEADER_MATCHERS.some((m) => n === m || n.includes("admission"))) return i;
  }
  return -1;
}

function findNameColumn(headers: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const n = normHeader(headers[i]);
    if (!n) continue;
    if (NAME_HEADER_MATCHERS.some((m) => n === m)) return i;
  }
  return -1;
}

function findComponentColumn(headers: string[], componentId: string): number {
  const want = normHeader(labelForComponentId(componentId));
  for (let i = 0; i < headers.length; i++) {
    const n = normHeader(headers[i]);
    if (!n) continue;
    if (n === want) return i;
    if (n.replace(/\s/g, "") === want.replace(/\s/g, "")) return i;
  }
  return -1;
}

export function expectedExcelHeaders(componentIds: string[]): string[] {
  return ["Admission Number", "Full Name", ...componentIds.map((id) => labelForComponentId(id))];
}

/**
 * Reads the first worksheet from an Excel workbook and validates rows against the course roster
 * and the currently selected assessment columns.
 */
export function parseGradeExcelWorkbook(
  workbook: XLSX.WorkBook,
  roster: CourseStudent[],
  componentIds: string[]
): ExcelImportResult {
  const errors: string[] = [];
  const name = workbook.SheetNames[0];
  if (!name) {
    return { rows: [], summary: { dataRows: 0, matchedRows: 0, unmatchedRows: 0, rowsWithCellIssues: 0 }, errors: ["Workbook has no sheets."] };
  }
  const sheet = workbook.Sheets[name];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!matrix || matrix.length < 2) {
    return {
      rows: [],
      summary: { dataRows: 0, matchedRows: 0, unmatchedRows: 0, rowsWithCellIssues: 0 },
      errors: ["The sheet must have a header row and at least one data row."],
    };
  }

  const headerCells = (matrix[0] ?? []).map((c) => (c === null || c === undefined ? "" : String(c)));
  const maxCols = Math.max(
    headerCells.length,
    ...matrix.slice(1).map((r) => (Array.isArray(r) ? r.length : 0))
  );
  const headers = Array.from({ length: maxCols }, (_, i) => (headerCells[i] ?? "").trim());

  const admCol = findAdmissionColumn(headers);
  if (admCol === -1) {
    errors.push(
      `Missing admission column. Use one of these headers in row 1: ${ADMISSION_HEADER_MATCHERS.slice(0, 3).join(", ")}.`
    );
  }
  const nameCol = findNameColumn(headers);
  const compCols: Record<string, number> = {};
  const missingLabels: string[] = [];
  for (const cid of componentIds) {
    const idx = findComponentColumn(headers, cid);
    if (idx === -1) missingLabels.push(labelForComponentId(cid));
    else compCols[cid] = idx;
  }
  if (missingLabels.length > 0) {
    errors.push(`Missing grade column(s) in row 1: ${missingLabels.join(", ")}.`);
  }

  if (errors.length > 0 || admCol === -1) {
    return { rows: [], summary: { dataRows: 0, matchedRows: 0, unmatchedRows: 0, rowsWithCellIssues: 0 }, errors };
  }

  const rosterByAdmission = new Map<string, CourseStudent>();
  for (const s of roster) {
    rosterByAdmission.set(normalizeAdmissionKey(s.admissionNumber), s);
  }

  const rows: ExcelPreviewRow[] = [];
  let matchedRows = 0;
  let unmatchedRows = 0;
  let rowsWithCellIssues = 0;

  for (let r = 1; r < matrix.length; r++) {
    const rawRow = matrix[r];
    if (!Array.isArray(rawRow)) continue;
    const cells = Array.from({ length: maxCols }, (_, i) => {
      const v = rawRow[i];
      return v === null || v === undefined ? "" : String(v).trim();
    });
    const admissionNumber = (cells[admCol] ?? "").trim();
    const fullName = nameCol >= 0 ? (cells[nameCol] ?? "").trim() : "";
    if (!admissionNumber) {
      const allEmpty = cells.every((c) => c === "");
      if (allEmpty) continue;
    }
    if (!admissionNumber) continue;

    const scores: Record<string, string> = {};
    const cellIssues: Partial<Record<string, string>> = {};
    const rowIssues: string[] = [];

    for (const cid of componentIds) {
      const col = compCols[cid];
      const raw = col !== undefined ? (cells[col] ?? "").trim() : "";
      scores[cid] = raw;
      if (!isBlankScore(raw) && !isValidScoreToken(raw)) {
        cellIssues[cid] = "Use a number (e.g. 12 or 12.5).";
      }
    }

    const key = normalizeAdmissionKey(admissionNumber);
    const match = rosterByAdmission.get(key);
    if (!match) {
      rowIssues.push("Admission number not found on this course roster.");
      unmatchedRows += 1;
    } else {
      matchedRows += 1;
    }

    if (Object.keys(cellIssues).length > 0) rowsWithCellIssues += 1;

    rows.push({
      sheetRow: r + 1,
      admissionNumber,
      fullName,
      scores,
      cellIssues,
      rowIssues,
      rosterStudentId: match?.id ?? null,
    });
  }

  if (rows.length === 0) {
    errors.push("No data rows found after the header (check admission numbers are filled in).");
  }

  return {
    rows,
    summary: {
      dataRows: rows.length,
      matchedRows,
      unmatchedRows,
      rowsWithCellIssues,
    },
    errors,
  };
}

export function readExcelWorkbookFromArrayBuffer(buf: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(buf, { type: "array" });
}

/** True when the import must not be applied (blocking errors, no data, or any row has roster/cell problems). */
export function excelImportHasAnyIssue(result: ExcelImportResult): boolean {
  if (result.errors.length > 0) return true;
  if (result.rows.length === 0) return true;
  for (const row of result.rows) {
    if (row.rowIssues.length > 0) return true;
    if (Object.keys(row.cellIssues).length > 0) return true;
  }
  return false;
}
