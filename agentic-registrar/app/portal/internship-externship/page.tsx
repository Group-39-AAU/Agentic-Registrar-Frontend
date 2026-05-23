"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Internship & Externship"
      subtitle="Industrial placements approved for your program"
      variant="info"
      intro="Internship listings refresh weekly. Most placements are paid and run 12–16 weeks; some give academic credit toward your industrial-internship requirement."
      cards={[
        { title: "Ethio Telecom — Software Intern", body: "12 weeks · Addis Ababa · Stipend ETB 7,500/mo · Backend (Java + Spring). Apply by 30 Apr." },
        { title: "Awash Bank — Data Analyst Intern", body: "16 weeks · Addis Ababa · Stipend ETB 8,000/mo · SQL, reporting, dashboards. Apply by 15 May." },
        { title: "Safaricom Ethiopia — DevOps", body: "12 weeks · Addis Ababa · Stipend ETB 8,500/mo · Linux, CI/CD, AWS. Apply by 5 May." },
        { title: "Ministry of Innovation — Research Externship", body: "8 weeks · Remote-friendly · ETB 5,000/mo. Apply year-round." },
      ]}
      rows={[
        { label: "Earliest start", value: "After Phase TWO of your 3rd year" },
        { label: "Approval", value: "Department head signs the internship-credit form" },
        { label: "Reporting", value: "Weekly log + final report" },
      ]}
    />
  );
}
