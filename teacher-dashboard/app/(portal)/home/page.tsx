import Link from "next/link";

export default function TeacherHomePage() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">Teacher home</h1>
        <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-[#4a5568]">
          Static UI preview: courses and grade sheets are generated in the browser only. Submissions are kept in this
          browser&apos;s storage for the demo flow.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Link
          href="/courses"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#9bb0cc] hover:shadow-md"
        >
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#2f76b7]">Courses</div>
          <div className="mt-2 text-[16px] font-bold text-[#1a1a1a]">My courses</div>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">
            Browse sections you teach (after choosing academic year and calendar semester: one, two, or three).
          </p>
          <div className="mt-4 text-[12px] font-semibold text-[#2f76b7] group-hover:underline">Open</div>
        </Link>

        <Link
          href="/courses"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#9bb0cc] hover:shadow-md"
        >
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#2f76b7]">Grade entry</div>
          <div className="mt-2 text-[16px] font-bold text-[#1a1a1a]">Enter grades</div>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">
            Choose year and calendar semester, open a course (up to two active sections per period), then enter marks or
            import from Excel.
          </p>
          <div className="mt-4 text-[12px] font-semibold text-[#2f76b7] group-hover:underline">Start</div>
        </Link>

        <Link
          href="/submissions"
          className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#9bb0cc] hover:shadow-md"
        >
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[#2f76b7]">History</div>
          <div className="mt-2 text-[16px] font-bold text-[#1a1a1a]">Submissions</div>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">
            View accepted or rejected batches, revise marks, and resubmit with reasoning until accepted.
          </p>
          <div className="mt-4 text-[12px] font-semibold text-[#2f76b7] group-hover:underline">View</div>
        </Link>
      </div>
    </div>
  );
}
