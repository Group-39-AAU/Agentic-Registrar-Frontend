"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

const courses = [
  { no: 1, title: "Advanced Database Systems", code: "SECT-5221", type: "Major", ects: "7.00", credit: "4.00" },
  { no: 2, title: "Pervasive Computing", code: "SECT-M5241", type: "Major", ects: "5.00", credit: "3.00" },
  { no: 3, title: "Natural Language Processing", code: "SECT-5501", type: "Major", ects: "5.00", credit: "3.00" },
  { no: 4, title: "Project I", code: "SECT - 5441", type: "Major", ects: "7.00", credit: "4.00" },
];

export default function RegisteredCoursesPage() {
  const searchParams = useSearchParams();
  const academicYear = searchParams.get("academicYear") || "2024/25";
  const showRegisteredTable = academicYear === "2024/25";
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const allSelected = selectedCourses.length === courses.length;

  function toggleCourse(courseNo: number) {
    setSelectedCourses((previous) =>
      previous.includes(courseNo) ? previous.filter((no) => no !== courseNo) : [...previous, courseNo],
    );
  }

  function toggleAllCourses() {
    setSelectedCourses(allSelected ? [] : courses.map((course) => course.no));
  }

  useEffect(() => {
    document.title = "Registered Courses | Addis Ababa University";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <TopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] pr-[130px]">
        <div className="flex gap-5">
          <PortalSideMenu />

          <section className="ml-[130px] flex-1">
            <div className="px-2 py-1 text-[16px]">
              <div className="max-w-[995px]">
                <h1 className="mb-2 border-b border-[#e0e0e0] pb-2 text-[24px] font-semibold text-[#222]">Course Registration</h1>

                <div className="grid grid-cols-[180px_360px_160px_1fr] gap-y-0 px-4">
                  <p className="font-semibold">Full Name</p>
                  <p>EPHREM MAMO TORA</p>
                  <p className="font-semibold">Class Year</p>
                  <p>Year V , Section</p>

                  <p className="font-semibold">ID No.</p>
                  <p>UGR/1504/14</p>
                  <p className="font-semibold">Admission Type</p>
                  <p>Regular</p>

                  <p className="self-center font-semibold">Program</p>
                  <p className="w-[324px]">Bachelor of Science in Software Engineering and Computing Technology (Software Engineering Stream)</p>
                  <p className="font-semibold">Due Amount</p>
                  <p>-</p>
                </div>


                {showRegisteredTable ? (
                  <>
                    <p className="mb-2 text-[16px] font-semibold italic text-[#2f78b7] my-6 mb-6 ml-[20px]">
                      You have been registered to the following courses !
                    </p>

                    <table className="w-full border-collapse text-[16px] text-[#1f1f1f]">
                      <thead>
                        <tr className="bg-[#d8ead5]">
                          <th className="border border-[#d9d9d9] p-[12px] text-left">No.</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Title</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Code</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Type</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">ECTS</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Credit Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course, idx) => (
                          <tr key={course.no} className={idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#e3e3e3]"}>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.no}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.title}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.code}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.type}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.ects}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.credit}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#dbe6f0] font-semibold">
                          <td colSpan={4} className="border border-[#d9d9d9] px-2 py-2 text-center">
                            Total ECTS/Credit
                          </td>
                          <td className="border border-[#d9d9d9] px-2 py-2">24.00</td>
                          <td className="border border-[#d9d9d9] px-2 py-2">14.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                ) : (
                  <>
                    <table className="w-full border-collapse text-[16px] text-[#1f1f1f] mt-10">
                      <thead>
                        <tr className="bg-[#d8ead5]">
                          <th className="border border-[#d9d9d9] p-[12px] text-left">
                            <input type="checkbox" checked={allSelected} onChange={toggleAllCourses} className="h-4 w-4 cursor-pointer" />
                          </th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">No.</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Title</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Code</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Course Type</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">ECTS</th>
                          <th className="border border-[#d9d9d9] p-[12px] text-left">Credit Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course, idx) => (
                          <tr key={course.no} className={idx % 2 === 0 ? "bg-[#ffffff]" : "bg-[#e3e3e3]"}>
                            <td className="border border-[#d9d9d9] p-[12px]">
                              <input
                                type="checkbox"
                                checked={selectedCourses.includes(course.no)}
                                onChange={() => toggleCourse(course.no)}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.no}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.title}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.code}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.type}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.ects}</td>
                            <td className="border border-[#d9d9d9] p-[12px]">{course.credit}</td>
                          </tr>
                        ))}
                        <tr className="bg-[#dbe6f0] font-semibold">
                          <td className="border border-[#d9d9d9] p-[12px]"></td>
                          <td colSpan={4} className="border border-[#d9d9d9] p-[12px] text-center">
                            Total ECTS/Credit
                          </td>
                          <td className="border border-[#d9d9d9] p-[12px]">24.00</td>
                          <td className="border border-[#d9d9d9] p-[12px]">14.00</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        disabled={selectedCourses.length === 0}
                        className="rounded bg-[#2f78b7] px-6 py-2 text-[16px] font-semibold text-white enabled:hover:bg-[#255f93] disabled:cursor-not-allowed disabled:bg-[#9ab9d5]"
                      >
                        Submit
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
