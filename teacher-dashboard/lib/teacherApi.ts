import type { AssessmentComponentId } from "./assessmentOptions";
import type { CalendarSemesterId, CourseStudent, TeacherCourse } from "./mockCourses";
import { getMockStudents, getTeacherCoursesForSemester } from "./mockCourses";

export type { CalendarSemesterId } from "./mockCourses";

export type GradeRowPayload = {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  scores: Record<string, string>;
};

export type SubmitGradePayload = {
  submissionId: string;
  courseId: string;
  components: AssessmentComponentId[];
  rows: GradeRowPayload[];
  /** Latest teacher explanation when resubmitting after simulated rejection. */
  reasoning?: string;
};

export type SubmitGradeResult =
  | { outcome: "ACCEPTED"; message?: string }
  | { outcome: "REJECTED"; feedback: string };

/** Artificial delay (ms) added to mock calls so loading states are visible in the UI. */
const MS = 90;

/** Simulates the AI grading-monitor review: requires a non-trivial reasoning string to accept. */
function mockAiReview(payload: SubmitGradePayload): SubmitGradeResult {
  const reasoning = (payload.reasoning ?? "").trim();
  if (!reasoning) {
    return {
      outcome: "REJECTED",
      feedback:
        "The grading assistant could not verify this submission without context. Please explain how these components map to your syllabus outcomes, any curving or rounding rules, and confirm all entered marks were verified against your mark sheet.",
    };
  }
  if (reasoning.length < 40) {
    return {
      outcome: "REJECTED",
      feedback:
        "Your explanation is too brief. Please add more detail: reference the assessment weighting, attendance or makeup policies if relevant, and confirm the marks are final for registrar processing.",
    };
  }
  return {
    outcome: "ACCEPTED",
    message: "Submission accepted. Marks will be queued for registrar review.",
  };
}

/** Returns the teacher's courses for the given academic year and semester from static mock data. */
export async function fetchTeacherCourses(
  academicYear: string | null | undefined,
  calendarSemester: CalendarSemesterId | null | undefined
): Promise<TeacherCourse[]> {
  await new Promise((r) => setTimeout(r, MS));
  if (!academicYear || !calendarSemester) return [];
  return getTeacherCoursesForSemester(academicYear, calendarSemester);
}

/** Returns the static mock roster for a given course. */
export async function fetchStudentsForCourse(courseId: string): Promise<CourseStudent[]> {
  await new Promise((r) => setTimeout(r, MS));
  return getMockStudents(courseId);
}

/** Submits a grade matrix for simulated AI review; acceptance depends on the reasoning length. */
export async function submitGradeMatrix(payload: SubmitGradePayload): Promise<SubmitGradeResult> {
  await new Promise((r) => setTimeout(r, 450));
  return mockAiReview(payload);
}
