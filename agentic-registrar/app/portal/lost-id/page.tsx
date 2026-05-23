"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Lost ID"
      subtitle="Report a lost student ID and request a replacement"
      variant="request"
      intro="Replacement IDs are issued within 3–5 working days. A small fee applies and will be reflected on your next fee statement."
      fields={[
        { label: "Date lost", type: "date", required: true },
        { label: "Circumstances", type: "textarea", placeholder: "Where + how it was lost", required: true },
        { label: "Police report (optional)", type: "file" },
      ]}
      ctaLabel="Submit lost-ID report"
    />
  );
}
