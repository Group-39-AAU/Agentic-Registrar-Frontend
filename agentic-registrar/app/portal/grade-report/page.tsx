"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import { useEffect } from "react";

function TopStrip() {
  return (
    <div className="border-b border-[#b8c7d5] bg-[linear-gradient(90deg,#eef4f8_0%,#d8e8f5_100%)] py-1">
      <div className="mx-[70px] flex h-[96px] max-w-[1200px] items-center px-6">
        <a href="http://localhost:3000/portal/home">
          <img src="/assets/logo.png" alt="AAU" className="h-[100px] w-[100px]" />
        </a>
        <div className="ml-4">
          <p className="text-[25px] leading-none text-[#cf2e2e]">ADDIS ABABA UNIVERSITY</p>
          <p className="mt-1 ml-12 text-[20px] font-bold leading-none text-[#cf2e2e]">አዲስ አበባ ዩኒቨርሲቲ</p>
          <p className="mt-1 ml-32 text-[16px] text-[#4a5a6a]">Seek wisdom, Elevate Your Intellect and Serve Humanity</p>
        </div>
      </div>
    </div>
  );
}

type CourseRow = {
  no: number;
  courseTitle: string;
  code: string;
  creditHour: string;
  ects: string;
  grade: string;
  assessment: string;
};

type SemesterBlock = {
  label: string;
  rows: CourseRow[];
  stats: { sgp: string; cgpaSemester: string; cgp: string; cgpaCumulative: string; status: string };
};

const semesters: SemesterBlock[] = [
  {
    label: "Academic Year : 2025/26,   Year V,   Semester : One",
    rows: [
      { no: 1, courseTitle: "Pervasive Computing", code: "SECT-M5241", creditHour: "3.00", ects: "5.00", grade: "A+", assessment: "Assessment" },
      { no: 2, courseTitle: "Advanced Database Systems", code: "SECT-5221", creditHour: "4.00", ects: "7.00", grade: "A", assessment: "Assessment" },
      { no: 3, courseTitle: "Project I", code: "SECT - 5441", creditHour: "4.00", ects: "7.00", grade: "A+", assessment: "Assessment" },
      { no: 4, courseTitle: "Natural Language Processing", code: "SECT-5501", creditHour: "3.00", ects: "5.00", grade: "B", assessment: "Assessment" },
    ],
    stats: { sgp: "91", cgpaSemester: "3.79", cgp: "978", cgpaCumulative: "3.81", status: "Promoted" },
  },
  {
    label: "Academic Year : 2024/25,   Year IV,   Semester : Two",
    rows: [
      { no: 1, courseTitle: "Software Architecture", code: "SECT-5102", creditHour: "3.00", ects: "5.00", grade: "A", assessment: "Assessment" },
      { no: 2, courseTitle: "Distributed Systems", code: "SECT-5108", creditHour: "3.00", ects: "5.00", grade: "A-", assessment: "Assessment" },
      { no: 3, courseTitle: "Machine Learning", code: "SECT-5113", creditHour: "4.00", ects: "6.00", grade: "B+", assessment: "Assessment" },
      { no: 4, courseTitle: "Human Computer Interaction", code: "SECT-5104", creditHour: "3.00", ects: "5.00", grade: "A", assessment: "Assessment" },
    ],
    stats: { sgp: "88", cgpaSemester: "3.62", cgp: "887", cgpaCumulative: "3.78", status: "Promoted" },
  },
  {
    label: "Academic Year : 2024/25,   Year IV,   Semester : One",
    rows: [
      { no: 1, courseTitle: "Compiler Design", code: "SECT-5003", creditHour: "3.00", ects: "5.00", grade: "B+", assessment: "Assessment" },
      { no: 2, courseTitle: "Cloud Computing", code: "SECT-5007", creditHour: "3.00", ects: "5.00", grade: "A-", assessment: "Assessment" },
      { no: 3, courseTitle: "Research Methods", code: "SECT-5001", creditHour: "2.00", ects: "3.00", grade: "A", assessment: "Assessment" },
      { no: 4, courseTitle: "Entrepreneurship", code: "SECT-5009", creditHour: "2.00", ects: "3.00", grade: "A", assessment: "Assessment" },
    ],
    stats: { sgp: "86", cgpaSemester: "3.55", cgp: "799", cgpaCumulative: "3.73", status: "Promoted" },
  },
];

export default function GradeReportPage() {
  useEffect(() => {
    document.title = "Grade Report | Addis Ababa University";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <TopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px]">
        <div className="flex gap-5">
          <PortalSideMenu />

          <section className="mx-[150px] flex-1">
            <div className="bg-white">
              <div className="border-b border-[#e4e4e4] pb-1">
                <h1 className="text-[24px] font-semibold">My Grade Report</h1>
              </div>

              <div className="py-4">
                <table className="w-full border-collapse text-[16px]">
                  <thead>
                    <tr className="bg-[#d8ead5] text-[#1f1f1f]">
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">No.</th>
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">Course Title</th>
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">Code</th>
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">Credit Hour</th>
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">ECTS</th>
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">Grade</th>
                      <th className="border border-[#d9d9d9] p-[12px] text-left font-semibold">Assessment</th>
                    </tr>
                  </thead>
                </table>

                <div className="overflow-hidden rounded-b-[4px] border border-t-0 border-[#d9d9d9]">
                  {semesters.map((semester) => (
                    <div key={semester.label} className="border-b border-[#e4e4e4] last:border-b-0">
                      <div className="px-[30px] pt-[40px] pb-[50px] text-[16px] font-semibold text-[#3d77a8]">{semester.label}</div>

                      <table className="w-full border-collapse text-[16px]">
                        <tbody>
                          {semester.rows.map((row, idx) => (
                            <tr key={`${semester.label}-${row.no}`} className={idx % 2 === 0 ? "bg-[#efefef]" : "bg-[#ffffff]"}>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.no}</td>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.courseTitle}</td>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.code}</td>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.creditHour}</td>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.ects}</td>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.grade}</td>
                              <td className="border border-[#d9d9d9] p-[14px]">{row.assessment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="m-4 rounded-[8px] border border-[#dedede] bg-[#ffffff] px-[80px] py-2 my-[50px]">
                        <div className="inline-grid grid-cols-2 gap-x-[100px]">
                          <p className="font-semibold">SGP : {semester.stats.sgp}</p>
                          <p className="font-semibold">SGPA : {semester.stats.cgpaSemester}</p>
                          <p className="font-semibold">CGP : {semester.stats.cgp}</p>
                          <p className="font-semibold">CGPA : {semester.stats.cgpaCumulative}</p>
                        </div>
                        <p className="mt-6 font-semibold">Academic Status : {semester.stats.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
