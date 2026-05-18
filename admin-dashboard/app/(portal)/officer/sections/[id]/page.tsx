"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Section } from "@/components/ApiHelpers";

export default function SectionDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sectionId = params?.id ?? "";
  const termId = searchParams.get("term_id") ?? "";
  const programId = searchParams.get("program_id") ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-[12px] font-semibold tracking-[0.08em] text-[#5a5a5a]">
        <Link
          href="/officer"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 uppercase text-[#2f76b7] hover:bg-[#2f76b7]/[0.08]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to Officer
        </Link>
      </div>

      <Section
        title="Section detail"
        subtitle="Students enrolled in this section will appear here."
      >
        <div className="grid grid-cols-1 gap-3 text-[13px] sm:grid-cols-3">
          <div className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a5a5a]">
              Section ID
            </p>
            <p className="mt-1 font-mono text-[12px] text-[#1f2f40] break-all">
              {sectionId || "—"}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a5a5a]">
              Term ID
            </p>
            <p className="mt-1 font-mono text-[12px] text-[#1f2f40] break-all">
              {termId || "—"}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-[#f8fafc] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5a5a5a]">
              Program ID
            </p>
            <p className="mt-1 font-mono text-[12px] text-[#1f2f40] break-all">
              {programId || "—"}
            </p>
          </div>
        </div>

        <p className="mt-6 rounded-md border border-dashed border-[#cfddec] bg-[#f4f8fc] px-4 py-6 text-center text-[13px] text-[#5a5a5a]">
          Student list endpoint not wired yet — point me at the API and I&apos;ll plug
          it in here.
        </p>
      </Section>
    </div>
  );
}
