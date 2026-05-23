"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Dormitory Fee"
      subtitle="On-campus housing charges"
      variant="fees"
      intro="Dormitory placements are reviewed each term. Fees are charged once per semester and waived for government-sponsored students."
      columns={["Term", "Block / Room", "Amount due (ETB)", "Status"]}
      table={[
        ["2025/2026 · Phase TWO", "Block 4 / Room 212", "1,800", "Paid"],
        ["2025/2026 · Phase ONE", "Block 4 / Room 212", "1,800", "Paid"],
        ["2024/2025 · Phase TWO", "Block 6 / Room 311", "1,600", "Paid"],
      ]}
    />
  );
}
