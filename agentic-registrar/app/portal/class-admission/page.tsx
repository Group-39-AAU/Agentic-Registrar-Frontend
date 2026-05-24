"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Class Admission"
      subtitle="Request admission to a specific class or section"
      variant="request"
      intro="Use this form when you need formal admission to a class you couldn't register for through the regular flow."
      fields={[
        { label: "Course code", placeholder: "e.g. SE201", required: true },
        { label: "Section", placeholder: "A / B / C", required: true },
        { label: "Reason", type: "textarea", placeholder: "Why do you need this admission?", required: true },
      ]}
      ctaLabel="Submit request"
    />
  );
}
