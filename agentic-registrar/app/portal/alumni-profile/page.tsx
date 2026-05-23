"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Alumni Profile Form"
      subtitle="Keep your post-graduation profile up to date"
      variant="form"
      intro="Alumni records help the university support career networking, alumni events, and ongoing research opportunities."
      fields={[
        { label: "Year of graduation", type: "number", placeholder: "e.g. 2024", required: true },
        { label: "Degree", placeholder: "e.g. BSc Software Engineering", required: true },
        { label: "Current employer", placeholder: "Organisation name" },
        { label: "Job title", placeholder: "Your current role" },
        { label: "City / country", placeholder: "e.g. Addis Ababa, Ethiopia" },
        { label: "LinkedIn or personal site", type: "text" },
        { label: "Short bio", type: "textarea" },
      ]}
      ctaLabel="Save profile"
    />
  );
}
