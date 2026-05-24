"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="My Profile"
      subtitle="Personal, academic, and contact details on file"
      variant="info"
      cards={[
        { title: "Personal", body: "Name, date of birth, gender, nationality." },
        { title: "Academic", body: "Department, program, year of study, advisor." },
        { title: "Contact", body: "Phone, email, emergency contact, home address." },
      ]}
      rows={[
        { label: "Full Name", value: "Yohannes Abdia" },
        { label: "UGR ID", value: "UGR/9999/14" },
        { label: "Department", value: "Software Engineering" },
        { label: "Current Semester", value: "1" },
        { label: "Email", value: "yohannes.abdia@gmail.com" },
        { label: "Phone", value: "+251 9xx xxx xxx" },
      ]}
    />
  );
}
