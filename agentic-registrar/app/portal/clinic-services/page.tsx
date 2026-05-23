"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Clinic Services"
      subtitle="Campus health services for registered students"
      variant="info"
      cards={[
        { title: "General consultation", body: "Walk-in appointments 08:30–17:30 weekdays. Saturdays 09:00–13:00." },
        { title: "Pharmacy", body: "Same hours as the clinic. Common medications stocked; prescriptions referred to off-campus pharmacies." },
        { title: "Mental health", body: "Counsellor on duty Tuesdays and Thursdays. Confidential sessions by appointment." },
        { title: "Emergency", body: "Call the campus security desk for after-hours emergencies; off-campus hospitals are 5–10 min away." },
      ]}
      rows={[
        { label: "Location", value: "Block H, near the south gate" },
        { label: "Phone", value: "+251 9xx xxx xxx" },
        { label: "After-hours emergency", value: "Campus Security · ext. 999" },
      ]}
    />
  );
}
