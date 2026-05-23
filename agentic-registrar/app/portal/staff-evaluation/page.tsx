"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Staff Evaluation"
      subtitle="Confidential end-of-term instructor feedback"
      variant="form"
      intro="Your responses are anonymous and aggregated at the department level. Instructors never see individual responses."
      fields={[
        { label: "Instructor", type: "select", options: ["Lemma Bekele — SE101", "Bethel Tadesse — SE102", "Alemayehu Bekele — SE103"], required: true },
        { label: "Course preparation", type: "select", options: ["1 — Poor", "2", "3 — Adequate", "4", "5 — Excellent"], required: true },
        { label: "Clarity of explanations", type: "select", options: ["1 — Poor", "2", "3 — Adequate", "4", "5 — Excellent"], required: true },
        { label: "Fairness of assessment", type: "select", options: ["1 — Poor", "2", "3 — Adequate", "4", "5 — Excellent"], required: true },
        { label: "Approachability", type: "select", options: ["1 — Poor", "2", "3 — Adequate", "4", "5 — Excellent"], required: true },
        { label: "Additional comments", type: "textarea" },
      ]}
      ctaLabel="Submit evaluation"
    />
  );
}
