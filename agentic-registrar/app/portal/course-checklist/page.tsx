"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Course Checklist"
      subtitle="Track your progress through the program"
      variant="checklist"
      intro="Required courses are listed by semester. Status shows whether you've completed, are currently enrolled in, or have yet to take each course."
      columns={["Code", "Title", "Credits", "Semester", "Status"]}
      table={[
        ["SE101", "Calculus I", "4", "1", "Enrolled"],
        ["SE102", "Programming Fundamentals", "4", "1", "Enrolled"],
        ["SE103", "Engineering Drawing", "3", "1", "Enrolled"],
        ["SE104", "Engineering Mechanics", "3", "1", "Enrolled"],
        ["SE201", "Calculus II", "4", "2", "Pending"],
        ["SE202", "Physics for Engineers", "4", "2", "Pending"],
        ["SE303", "Data Structures", "4", "3", "Pending"],
        ["SE304", "Object-Oriented Programming", "4", "3", "Pending"],
        ["SE401", "Software Architecture", "3", "4", "Pending"],
      ]}
    />
  );
}
