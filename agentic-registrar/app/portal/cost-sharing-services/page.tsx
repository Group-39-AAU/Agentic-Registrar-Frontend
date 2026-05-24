"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Cost Sharing Services"
      subtitle="Government-sponsored students: cost-sharing obligations and repayment"
      variant="info"
      intro="Government-sponsored students sign a cost-sharing form at registration; repayment is deferred until graduation and proportional to the courses taken."
      cards={[
        { title: "Eligibility", body: "Applies to all government-sponsored degree students." },
        { title: "Coverage", body: "Tuition + dormitory + cafeteria are covered each term; the cost-sharing form attaches the obligation to your record." },
        { title: "Repayment", body: "Begins 6 months after graduation. Repayment runs through the Ministry of Revenue's payroll deduction scheme." },
        { title: "Where to ask", body: "Cost-sharing office (Block A, Room 102) or email costsharing@aau.edu.et." },
      ]}
      rows={[
        { label: "Form per term", value: "Cost Sharing Form (signed at registration)" },
        { label: "Default coverage", value: "Tuition · Dormitory · Cafeteria" },
        { label: "Repayment start", value: "6 months post-graduation" },
      ]}
    />
  );
}
