/**
 * Generates sample grade Excel files for manual import testing.
 * Full Name + admission numbers match {@link getStaticStudentsForCourse} (same pools as staticTeacherData).
 *
 * Run: npm run sample-data:grades
 * Optional course id (default course_10 — roster starts Aster Gessesse / ETS0001/13, includes Genet Desta / ETS0103/19, Dawit Desta / ETS0161/13, …):
 *   npm run sample-data:grades -- course_2
 *
 * Default section maps to catalog bucket: 2025/26, calendar semester One (semester=1):
 *   /grades/enter?course=course_10&year=2025%2F26&semester=1
 * Select components: Test 1–3, Assignment 1–2, Mid 1, Project 1, Final (same as row 1 headers).
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { getStaticStudentsForCourse } from "../lib/staticTeacherData";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HEADERS = [
  "Admission Number",
  "Full Name",
  "Test 1",
  "Test 2",
  "Test 3",
  "Assignment 1",
  "Assignment 2",
  "Mid 1",
  "Project 1",
  "Final",
];

const courseId = process.argv[2] ?? "course_10";
const roster = getStaticStudentsForCourse(courseId);

function writeBook(filename: string, aoa: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Grades");
  const out = path.join(__dirname, "..", "sample-data", filename);
  XLSX.writeFile(wb, out);
  console.log("Wrote", out, `(${aoa.length - 1} data rows, course ${courseId})`);
}

/** Deterministic numeric scores in a realistic band for every student row. */
function baseScores(rowIndex: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < 8; c++) {
    const v = 52 + ((rowIndex * 17 + c * 31 + rowIndex * c) % 44);
    out.push(v);
  }
  return out;
}

const complete: (string | number)[][] = [HEADERS];
for (let i = 0; i < roster.length; i++) {
  const r = roster[i];
  const [a, b, c, d, e, f, g, h] = baseScores(i);
  complete.push([r.admissionNumber, r.fullName, a, b, c, d, e, f, g, h]);
}
writeBook("grades_complete_sample.xlsx", complete);

const issues: (string | number)[][] = [HEADERS];
for (let i = 0; i < roster.length; i++) {
  const r = roster[i];
  if (i === 0) {
    issues.push([r.admissionNumber, r.fullName, "", "", "", "", "", "", "", ""]);
  } else if (i === 1) {
    issues.push([r.admissionNumber, r.fullName, "not-a-number", 70, 71, 72, 73, 74, 75, 76]);
  } else if (i === 3) {
    issues.push([r.admissionNumber, "", 88, 89, 90, 91, 92, 93, 94, 95]);
  } else if (i === 4) {
    issues.push([r.admissionNumber, r.fullName, "12.5.3", 70, 71, 72, 73, 74, 75, 76]);
  } else {
    const [a, b, c, d, e, f, g, h] = baseScores(i);
    issues.push([r.admissionNumber, r.fullName, a, b, c, d, e, f, g, h]);
  }
}
issues.push(["ETS9999/99", "Nobody Here", 60, 61, 62, 63, 64, 65, 66, 67]);
writeBook("grades_with_validation_issues.xlsx", issues);
