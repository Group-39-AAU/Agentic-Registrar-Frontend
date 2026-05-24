"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Withdrawal Request"
      subtitle="Withdraw from a course or the term"
      variant="request"
      intro="Withdrawal requests must be submitted before the published deadline. Late withdrawals may receive a 'W' grade on your transcript."
      fields={[
        { label: "Withdrawal type", type: "select", options: ["Single course", "Full term"], required: true },
        { label: "Course code (if single)", placeholder: "e.g. SE103" },
        { label: "Effective date", type: "date", required: true },
        { label: "Reason", type: "textarea", required: true },
      ]}
      ctaLabel="Submit withdrawal"
    />
  );
}
