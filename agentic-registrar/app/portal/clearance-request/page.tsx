"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Clearance Request"
      subtitle="Request graduation or end-of-term clearance"
      variant="request"
      intro="Clearance confirms you have no outstanding library, dormitory, or financial obligations before transcript release or graduation."
      fields={[
        { label: "Clearance type", type: "select", options: ["Graduation", "Transfer", "Withdrawal", "End-of-term"], required: true },
        { label: "Effective date", type: "date", required: true },
        { label: "Notes", type: "textarea", placeholder: "Any context for the registrar" },
      ]}
      ctaLabel="Request clearance"
    />
  );
}
