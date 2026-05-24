"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Tuition Fee"
      subtitle="Per-term tuition statement"
      variant="fees"
      intro="Self-sponsored students see the per-credit cost; government-sponsored students see zero amount due."
      columns={["Term", "Credits", "Rate (ETB)", "Amount due (ETB)", "Status"]}
      table={[
        ["2025/2026 · Phase TWO", "17", "320", "5,440", "Paid"],
        ["2025/2026 · Phase ONE", "18", "320", "5,760", "Paid"],
        ["2024/2025 · Phase TWO", "16", "320", "5,120", "Paid"],
      ]}
    />
  );
}
