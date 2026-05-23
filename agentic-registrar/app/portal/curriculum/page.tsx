"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="My Curriculum"
      subtitle="Required courses across your full program of study"
      variant="checklist"
      intro="Tick courses you've completed. Completed credits count toward your CGPA and credit-hour total."
      columns={["Semester", "Code", "Title", "Credits", "Status"]}
      table={[
        ["1", "SE101", "Calculus I", "4", "Required"],
        ["1", "SE102", "Programming Fundamentals", "4", "Required"],
        ["1", "SE103", "Engineering Drawing", "3", "Required"],
        ["1", "SE104", "Engineering Mechanics", "3", "Required"],
        ["2", "SE201", "Calculus II", "4", "Required"],
        ["2", "SE202", "Physics for Engineers", "4", "Required"],
        ["3", "SE303", "Data Structures", "4", "Required"],
        ["3", "SE304", "Object-Oriented Programming", "4", "Required"],
      ]}
    />
  );
}
