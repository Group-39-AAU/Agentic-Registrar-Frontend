type TeacherLoadPreviewRow = {
  staffId: string;
  staffName: string;
  semester: 1 | 2 | 3 | 4;
  weeklyHours: number;
  workloadBand: "LIGHT" | "NORMAL" | "HEAVY";
};

// Deterministic mock used only for UI/logic sketching while offline.
// This file is intentionally not imported anywhere and has no exports.
function buildTeacherLoadPreviewRows(seed = 11): TeacherLoadPreviewRow[] {
  const staffNames = [
    "A. Tesfaye",
    "B. Alemayehu",
    "C. Bekele",
    "D. Tesfaw",
    "E. Endale",
    "F. Worku",
  ];

  const rows: TeacherLoadPreviewRow[] = [];
  for (let index = 0; index < 6; index++) {
    const staffName = staffNames[index] ?? "Staff";
    const semester = (1 + (index % 4)) as 1 | 2 | 3 | 4;
    const weeklyHours = 7 + ((seed + index * 9) % 16); // 7..22
    rows.push({
      staffId: `TCH-${seed}-${index}`,
      staffName,
      semester,
      weeklyHours,
      workloadBand: classifyWorkload(weeklyHours),
    });
  }

  return rows;
}

function classifyWorkload(weeklyHours: number): "LIGHT" | "NORMAL" | "HEAVY" {
  if (weeklyHours <= 12) return "LIGHT";
  if (weeklyHours <= 18) return "NORMAL";
  return "HEAVY";
}

// Keep computed values "used" so TypeScript/lint doesn't complain.
const teacherLoadPreviewRows = buildTeacherLoadPreviewRows();
const _workloadHeavyCount = teacherLoadPreviewRows.filter(
  (r) => r.workloadBand === "HEAVY"
).length;
void _workloadHeavyCount;
