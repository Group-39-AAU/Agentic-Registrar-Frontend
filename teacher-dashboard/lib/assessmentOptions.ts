export type AssessmentComponentId = string;

export type AssessmentOption = { id: AssessmentComponentId; label: string };

/** Builds a numbered list of assessment options with IDs like `"test_1"`, `"test_2"`, … */
function range(prefix: string, label: string, count: number): AssessmentOption[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}_${i + 1}`,
    label: `${label} ${i + 1}`,
  }));
}

/**
 * Fixed 27-item palette used for grade entry:
 * 6 tests, 6 assignments, 2 mids, 6 quizzes, 6 projects, 1 final.
 */
export const ASSESSMENT_OPTIONS: AssessmentOption[] = [
  ...range("test", "Test", 6),
  ...range("assignment", "Assignment", 6),
  ...range("mid", "Mid", 2),
  ...range("quiz", "Quiz", 6),
  ...range("project", "Project", 6),
  { id: "final", label: "Final" },
];

/** Returns the display label for a component ID, or the raw ID if not found. */
export function labelForComponentId(id: string): string {
  return ASSESSMENT_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
