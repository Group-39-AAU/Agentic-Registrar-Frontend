import { Suspense } from "react";
import CoursesPageClient from "./CoursesPageClient";

export default function TeacherCoursesPage() {
  return (
    <Suspense
      fallback={<p className="rounded-xl border border-gray-200 bg-white p-6 text-[13px] text-[#5a5a5a]">Loading…</p>}
    >
      <CoursesPageClient />
    </Suspense>
  );
}
