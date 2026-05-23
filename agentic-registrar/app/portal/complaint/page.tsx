"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Complaint"
      subtitle="File a formal complaint with the registrar's office"
      variant="form"
      intro="Complaints are reviewed by the Dean of Students within 5 working days. Pick the right category so it routes to the appropriate office."
      fields={[
        { label: "Category", type: "select", options: ["Academic", "Administrative", "Harassment", "Facilities", "Other"], required: true },
        { label: "Subject", placeholder: "Short title", required: true },
        { label: "Description", type: "textarea", required: true },
        { label: "Attachments", type: "file" },
      ]}
      ctaLabel="File complaint"
    />
  );
}
