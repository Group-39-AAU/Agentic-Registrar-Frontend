/**
 * Large in-memory datasets for teacher UI demos only (no backend).
 */

export type CalendarSemesterId = "1" | "2" | "3";

export type TeacherCourse = {
  id: string;
  code: string;
  title: string;
  section?: string;
  /** e.g. 2025/26 */
  academicYear: string;
  calendarSemester: CalendarSemesterId;
};

export const TEACHER_ACADEMIC_YEARS = ["2022/23", "2023/24", "2024/25", "2025/26"] as const;

export const CALENDAR_SEMESTER_OPTIONS: { id: CalendarSemesterId; label: string }[] = [
  { id: "1", label: "One" },
  { id: "2", label: "Two" },
  { id: "3", label: "Three" },
];

export function calendarSemesterLabel(id: CalendarSemesterId): string {
  return CALENDAR_SEMESTER_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

/** Active teaching load cap per semester in the UI model. */
export const MAX_ACTIVE_TEACHER_COURSES = 2;

export type CourseStudent = {
  id: string;
  admissionNumber: string;
  fullName: string;
};

const DEPTS = ["CS", "SE", "IS", "IT", "MATH", "STAT", "PHYS", "CHEM", "BIO", "ECON", "MGMT", "LAW", "ENG", "ARCH"] as const;
const TOPICS = [
  "Introduction to",
  "Advanced",
  "Applied",
  "Modern",
  "Principles of",
  "Survey of",
  "Topics in",
  "Engineering",
  "Laboratory:",
  "Seminar:",
  "Computational",
  "Foundations of",
] as const;
const SUBJECTS = [
  "Programming",
  "Algorithms",
  "Data Structures",
  "Database Systems",
  "Computer Networks",
  "Operating Systems",
  "Software Engineering",
  "Linear Algebra",
  "Calculus I",
  "Probability",
  "Physics I",
  "Organic Chemistry",
  "Microeconomics",
  "Business Analytics",
  "Constitutional Law",
  "Technical Writing",
  "Discrete Mathematics",
  "Numerical Methods",
  "Machine Learning",
  "Information Security",
  "Distributed Systems",
  "Human–Computer Interaction",
  "Compiler Design",
  "Digital Logic",
  "Signals and Systems",
  "Control Theory",
  "Thermodynamics",
  "Genetics",
  "Cell Biology",
  "Macroeconomics",
  "Financial Accounting",
  "Contract Law",
  "Statics",
  "Fluid Mechanics",
] as const;

const FIRST = [
  "Alemayehu",
  "Bethelhem",
  "Chala",
  "Dawit",
  "Eden",
  "Fikirte",
  "Getachew",
  "Hanna",
  "Israel",
  "Jember",
  "Kidan",
  "Liya",
  "Mikias",
  "Nardos",
  "Omer",
  "Petros",
  "Rahel",
  "Samuel",
  "Tigist",
  "Urgessa",
  "Winta",
  "Yared",
  "Zelalem",
  "Aster",
  "Binyam",
  "Desta",
  "Eyerusalem",
  "Fasika",
  "Gedion",
  "Haymanot",
  "Kalkidan",
  "Mahlet",
  "Nahom",
  "Rediet",
  "Saron",
  "Tewodros",
  "Yonas",
  "Abenezer",
  "Birtukan",
  "Daniel",
  "Eleni",
  "Henok",
  "Meron",
  "Solomon",
  "Tadesse",
  "Yodit",
  "Zenebework",
  "Amsale",
  "Bereket",
  "Genet",
];

const LAST = [
  "Tadesse",
  "Girma",
  "Mohammed",
  "Haile",
  "Worku",
  "Lemma",
  "Assefa",
  "Bekele",
  "Negash",
  "Tesfaye",
  "Gebre",
  "Alemu",
  "Hailu",
  "Mekonnen",
  "Yohannes",
  "Desta",
  "Kebede",
  "Tsegaye",
  "Wolde",
  "Bogale",
  "Fekadu",
  "Gessesse",
  "Mulugeta",
  "Nigusu",
  "Sisay",
  "Tilahun",
  "Wondimu",
  "Zewdu",
  "Admassu",
  "Belay",
  "Dawit",
  "Elias",
  "Gebremedhin",
  "Kassa",
  "Mamo",
  "Reda",
  "Tekle",
  "Yimer",
  "Abera",
  "Bantihun",
  "Demissie",
  "Fasil",
  "Gidey",
  "Habtamu",
  "Jember",
  "Kifle",
  "Lemma",
  "Mengistu",
  "Nuru",
  "Oljira",
  "Petros",
  "Regassa",
  "Shiferaw",
  "Taddese",
  "Umer",
  "Walelign",
  "Yilma",
  "Zelalem",
];

/** Total sections offered in the static catalog. */
export const STATIC_COURSE_COUNT = 64;

function courseIndexFromId(courseId: string): number {
  const m = /^course_(\d+)$/.exec(courseId);
  if (m) return Math.max(0, parseInt(m[1], 10) - 1);
  let h = 0;
  for (let i = 0; i < courseId.length; i++) h = (h * 31 + courseId.charCodeAt(i)) >>> 0;
  return h % 10_000;
}

let cachedCourses: TeacherCourse[] | null = null;

export function getStaticCourses(): TeacherCourse[] {
  if (cachedCourses) return cachedCourses;
  cachedCourses = Array.from({ length: STATIC_COURSE_COUNT }, (_, i) => {
    const idx = i + 1;
    const dept = DEPTS[i % DEPTS.length];
    const num = 200 + ((i * 11) % 130);
    const title = `${TOPICS[i % TOPICS.length]} ${SUBJECTS[i % SUBJECTS.length]}`;
    const academicYears = ["2022/23", "2023/24", "2024/25", "2025/26"] as const;
    const semesters: CalendarSemesterId[] = ["1", "2", "3"];
    const bucket = i % 12;
    const yearIdx = Math.floor(bucket / 3) % 4;
    const calendarSemester = semesters[bucket % 3]!;
    return {
      id: `course_${idx}`,
      code: `${dept}${num}`,
      title,
      section: String.fromCharCode(65 + (i % 5)),
      academicYear: academicYears[yearIdx],
      calendarSemester,
    };
  });
  return cachedCourses;
}

export function getStaticCourseById(id: string): TeacherCourse | undefined {
  return getStaticCourses().find((c) => c.id === id);
}

export function parseCalendarSemesterId(value: string | null): CalendarSemesterId | null {
  if (value === "1" || value === "2" || value === "3") return value;
  return null;
}

/** Up to {@link MAX_ACTIVE_TEACHER_COURSES} courses for the selected academic year and calendar semester. */
export function getTeacherCoursesForSemester(
  academicYear: string,
  calendarSemester: CalendarSemesterId
): TeacherCourse[] {
  const pool = getStaticCourses()
    .filter((c) => c.academicYear === academicYear && c.calendarSemester === calendarSemester)
    .sort((a, b) => {
      const na = parseInt(/^course_(\d+)$/.exec(a.id)?.[1] ?? "0", 10);
      const nb = parseInt(/^course_(\d+)$/.exec(b.id)?.[1] ?? "0", 10);
      return na - nb;
    });
  return pool.slice(0, MAX_ACTIVE_TEACHER_COURSES);
}

/** Roster size per course (large, varies slightly by course for realism). */
export function staticStudentCountForCourse(courseId: string): number {
  const ix = courseIndexFromId(courseId);
  return 152 + (ix % 48);
}

export function getStaticStudentsForCourse(courseId: string): CourseStudent[] {
  const ix = courseIndexFromId(courseId);
  const count = staticStudentCountForCourse(courseId);
  return Array.from({ length: count }, (_, j) => {
    const fi = (ix * 997 + j * 13) % FIRST.length;
    const li = (ix * 331 + j * 17) % LAST.length;
    const serial = String(j + 1).padStart(4, "0");
    const year = 12 + ((ix + j) % 8);
    return {
      id: `${courseId}_stu_${j}`,
      admissionNumber: `ETS${serial}/${year}`,
      fullName: `${FIRST[fi]} ${LAST[li]}`,
    };
  });
}
