"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Upload Bank Receipt"
      subtitle="Submit proof of payment for review"
      variant="upload"
      intro="Upload a scan or photo of the bank deposit slip. Include the reference number used on the slip so the registrar can match it to your account."
      fields={[
        { label: "Receipt file", type: "file", required: true },
        { label: "Reference number", placeholder: "e.g. PAY-2025-001234", required: true },
        { label: "Amount (ETB)", type: "number", placeholder: "e.g. 4500" },
        { label: "Notes", type: "textarea", placeholder: "Any context the registrar should know" },
      ]}
      ctaLabel="Upload receipt"
    />
  );
}
