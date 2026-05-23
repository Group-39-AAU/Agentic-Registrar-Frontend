"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Makeup Request"
      subtitle="Request a makeup class or assessment"
      variant="request"
      intro="Use this form to request a makeup for a missed class, lab, or continuous-assessment component."
      fields={[
        { label: "Course code", placeholder: "e.g. SE102", required: true },
        { label: "Type", type: "select", options: ["Class", "Lab", "Quiz", "Continuous assessment"], required: true },
        { label: "Date missed", type: "date", required: true },
        { label: "Reason", type: "textarea", required: true },
        { label: "Supporting document", type: "file" },
      ]}
      ctaLabel="Submit makeup request"
    />
  );
}
