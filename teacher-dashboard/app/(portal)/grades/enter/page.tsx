import { Suspense } from "react";
import GradeEnterClient from "@/components/GradeEnterClient";

export default function EnterGradesPage() {
  return (
    <Suspense
      fallback={<p className="rounded-xl border border-gray-200 bg-white p-6 text-[13px] text-[#5a5a5a]">Loading…</p>}
    >
      <GradeEnterClient />
    </Suspense>
  );
}
