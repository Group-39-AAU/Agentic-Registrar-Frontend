"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Re-Exam Request"
      subtitle="Apply to sit a missed or failed examination"
      variant="request"
      intro="Eligible reasons include documented medical absence, family emergency, or a confirmed grading error."
      fields={[
        { label: "Course", type: "select", options: ["SE101 — Calculus I", "SE102 — Programming Fundamentals", "SE103 — Engineering Drawing", "SE104 — Engineering Mechanics"], required: true },
        { label: "Exam date missed", type: "date", required: true },
        { label: "Reason category", type: "select", options: ["Medical", "Family emergency", "Grading error", "Other"], required: true },
        { label: "Supporting document", type: "file" },
        { label: "Detailed explanation", type: "textarea", required: true },
      ]}
      ctaLabel="Submit re-exam request"
    />
  );
}
