"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Readmission Request"
      subtitle="Request reinstatement after a dismissal or extended absence"
      variant="request"
      intro="Provide context on why you were away and how you'll succeed if readmitted. The department head reviews each request individually."
      fields={[
        { label: "Last term attended", placeholder: "e.g. 2024/2025 Phase TWO", required: true },
        { label: "Reason for absence", type: "select", options: ["Academic dismissal", "Medical", "Financial", "Personal", "Other"], required: true },
        { label: "Plan for success", type: "textarea", placeholder: "How will you succeed this time?", required: true },
        { label: "Supporting documents", type: "file" },
      ]}
      ctaLabel="Submit readmission request"
    />
  );
}
