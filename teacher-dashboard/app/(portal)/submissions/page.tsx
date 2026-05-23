"use client";

import Link from "next/link";

export default function SubmissionsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">Submissions</h1>
        <p className="mt-2 max-w-[760px] text-[14px] text-[#4a5568]">
          Submissions now live on each section. Pick a term in{" "}
          <Link
            href="/courses"
            className="font-semibold text-[#2f76b7] underline"
          >
            My courses
          </Link>{" "}
          to see every (section × course) you teach, then click{" "}
          <strong>Enter grades</strong> to review or update the batch. The
          batch&apos;s status (DRAFT, SUBMITTED, FLAGGED, REJECTED, AUTHORISED)
          is shown inside the workspace.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-[14px] text-[#5a5a5a]">
        Start from{" "}
        <Link href="/courses" className="font-semibold text-[#2f76b7] underline">
          My courses
        </Link>{" "}
        — the agent verdict, score grid, and submit/justify/reopen actions all
        live on the per-section workspace.
      </div>
    </div>
  );
}
