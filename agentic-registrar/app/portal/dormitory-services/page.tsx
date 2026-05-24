"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Dormitory Services"
      subtitle="Housing assignment, maintenance, and room-swap requests"
      variant="info"
      cards={[
        { title: "Assignment", body: "First-year boarders are placed automatically. Returning students pick a block during pre-registration." },
        { title: "Maintenance", body: "Open a ticket in the dormitory office (Block 4 ground floor). Typical turnaround 2–3 days." },
        { title: "Room swap", body: "Allowed once per academic year. File a room-swap request via the dorm warden." },
        { title: "Guest policy", body: "Day-time guests permitted with sign-in. Overnight guests require warden approval at least 24 h in advance." },
      ]}
      rows={[
        { label: "Warden office", value: "Block 4, ground floor" },
        { label: "Quiet hours", value: "22:00 – 06:00" },
        { label: "Emergency contact", value: "+251 9xx xxx xxx" },
      ]}
    />
  );
}
