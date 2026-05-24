"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Disability Service Request"
      subtitle="Request accommodations and accessibility support"
      variant="request"
      intro="The disability-services team coordinates exam accommodations, accessible classrooms, screen-reader-friendly materials, and personal-assistant support."
      fields={[
        { label: "Type of accommodation", type: "select", options: ["Exam time extension", "Note-taker", "Assistive device", "Sign-language interpreter", "Accessible dorm room", "Other"], required: true },
        { label: "Term", placeholder: "e.g. 2025/2026 Phase TWO", required: true },
        { label: "Supporting documentation", type: "file", required: true },
        { label: "Details", type: "textarea", required: true },
      ]}
      ctaLabel="Submit request"
    />
  );
}
