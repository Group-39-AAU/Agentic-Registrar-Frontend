import type { Metadata } from "next";
import { Suspense } from "react";
import RosterViewClient from "@/components/RosterViewClient";

export const metadata: Metadata = { title: "Roster" };

export default function RosterPage() {
  return (
    <Suspense
      fallback={<p className="rounded-xl border border-gray-200 bg-white p-6 text-[13px] text-[#5a5a5a]">Loading…</p>}
    >
      <RosterViewClient />
    </Suspense>
  );
}
