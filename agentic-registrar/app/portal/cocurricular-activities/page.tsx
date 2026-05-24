"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Cocurricular Activities"
      subtitle="Student clubs, societies, and sports"
      variant="info"
      intro="Participation in registered clubs counts toward your cocurricular transcript and is considered in scholarship reviews."
      cards={[
        { title: "AAU Coding Club", body: "Weekly meetups, hackathons, and open-source contributions. Meets every Thursday 17:00 in CS Lab 2." },
        { title: "Debate Society", body: "Competitive parliamentary debate. Open to all departments. Friday evenings, Block C-101." },
        { title: "Football", body: "Inter-faculty league. Trials at the start of every semester. Pitch booked Mon/Wed evenings." },
        { title: "Music & Arts", body: "Choir, traditional band, theatre. Performance every term-end and at university events." },
        { title: "Volunteering", body: "Community service: tutoring, blood drives, environmental clean-ups. Sign up via the student union office." },
        { title: "Innovation Lab", body: "Year-round mentorship for student startup ideas. Office in Block D, Room 304." },
      ]}
    />
  );
}
