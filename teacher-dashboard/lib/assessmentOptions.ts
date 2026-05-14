export type AssessmentComponentId = string;

export type AssessmentOption = { id: AssessmentComponentId; label: string };

function range(prefix: string, label: string, count: number): AssessmentOption[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_${i + 1}`,
    label: `${label} ${i + 1}`,
  }));
}

/** Fixed palette: tests, assignments, mids, quizzes, projects, final — as specified for grade entry. */
export const ASSESSMENT_OPTIONS: AssessmentOption[] = [
  ...range("test", "Test", 6),
  ...range("assignment", "Assignment", 6),
  ...range("mid", "Mid", 2),
  ...range("quiz", "Quiz", 6),
  ...range("project", "Project", 6),
  { id: "final", label: "Final" },
];

export function labelForComponentId(id: string): string {
  return ASSESSMENT_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
