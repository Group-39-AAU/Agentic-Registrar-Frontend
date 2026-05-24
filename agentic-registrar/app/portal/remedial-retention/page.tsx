"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Remedial & Retention"
      subtitle="Support programs for students on academic probation"
      variant="info"
      intro="Students placed on academic Warning have one term to recover. The university provides tutoring, time-management coaching, and faculty mentoring at no cost."
      cards={[
        { title: "Tutoring", body: "Free 1-on-1 tutoring in math, programming, and writing. Sign up at the Learning Center (Block B, Room 105)." },
        { title: "Study skills", body: "Weekly workshops on time management, note-taking, and exam preparation." },
        { title: "Mentoring", body: "Each probation student is paired with a faculty mentor for the recovery term. Monthly check-ins." },
        { title: "Counselling", body: "Confidential sessions for stress, anxiety, or personal challenges affecting your studies." },
      ]}
      rows={[
        { label: "Eligibility", value: "Students currently on academic Warning" },
        { label: "Cost", value: "Free for enrolled students" },
        { label: "Sign-up", value: "Learning Center, Block B Room 105" },
      ]}
    />
  );
}
