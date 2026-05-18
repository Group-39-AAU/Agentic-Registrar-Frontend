import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";

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
  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 px-3 md:mx-[150px] md:px-0">
            <div className="bg-white">
              <div className="border-b border-[#e4e4e4] pb-1">
                <h1 className="text-[24px] font-semibold">My Grade Report</h1>
              </div>

              <div className="py-4 overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                <table className="w-full min-w-[720px] border-collapse text-[16px]">
                  <thead>
                    <tr className="bg-[linear-gradient(180deg,#dff0db_0%,#cee2c5_100%)] text-[#1f1f1f] shadow-[inset_0_-1px_0_rgba(15,23,42,0.06)]">
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

                <div className="min-w-[720px] overflow-hidden rounded-b-[4px] border border-t-0 border-[#d9d9d9]">
                  {semesters.map((semester) => (
                    <div key={semester.label} className="border-b border-[#e4e4e4] last:border-b-0">
                      <div className="px-4 pt-6 pb-6 text-[15px] font-semibold text-[#3d77a8] md:px-[30px] md:pt-[40px] md:pb-[50px] md:text-[16px]">{semester.label}</div>

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

                      <div className="m-4 rounded-[8px] border border-[#dedede] bg-[#ffffff] px-4 py-2 md:my-[50px] md:px-[80px]">
                        <div className="inline-grid grid-cols-1 gap-x-8 gap-y-1 md:grid-cols-2 md:gap-x-[100px]">
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
