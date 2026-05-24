"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Scholarship"
      subtitle="Apply for a merit or need-based scholarship"
      variant="form"
      intro="Scholarships are awarded each spring for the following academic year. CGPA, financial need, and community involvement are all considered."
      fields={[
        { label: "Scholarship type", type: "select", options: ["Merit", "Need-based", "Departmental", "Athletic", "Research"], required: true },
        { label: "Academic year applied for", placeholder: "e.g. 2026/2027", required: true },
        { label: "Personal statement", type: "textarea", placeholder: "Why you should be considered (250–500 words)", required: true },
        { label: "Financial-need documentation", type: "file" },
        { label: "Reference name + email", placeholder: "Faculty or community reference" },
      ]}
      ctaLabel="Submit application"
    />
  );
}
