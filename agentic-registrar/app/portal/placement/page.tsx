"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Placement"
      subtitle="Your departmental placement after first-year results"
      variant="info"
      cards={[
        {
          title: "Placed Department",
          body: "Software Engineering — placed based on first-year GPA and stated preference (decision communicated by the registrar).",
        },
        {
          title: "Effective From",
          body: "Semester 2 of academic year 2025/2026.",
        },
      ]}
      rows={[
        { label: "First-year GPA", value: "3.55" },
        { label: "Stated 1st preference", value: "Software Engineering" },
        { label: "Placement decision", value: "Accepted" },
      ]}
    />
  );
}
