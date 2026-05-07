"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";

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

type SearchSelectProps = {
  id: string;
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  openSelectId: string | null;
  setOpenSelectId: (id: string | null) => void;
};

function SearchSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  openSelectId,
  setOpenSelectId,
}: SearchSelectProps) {
  const [search, setSearch] = useState("");
  const open = openSelectId === id;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, search]);

  return (
    <div>
      <p className="mb-2 text-[16px] text-[#2a2a2a]">{label}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenSelectId(open ? null : id)}
          className="flex cursor-pointer items-center justify-between rounded-t-[4px] border border-[#c9c9c9] py-2 px-4 text-left text-[46px] text-[#353535] shadow-sm sm:text-[28px] md:text-[22px] lg:text-[44px] xl:text-[42px]" style={{ width: "347px" }}
        >
          <span className="text-[16px] sm:text-[20px] md:text-[16px] lg:text-[20px] xl:text-[16px]">{value || placeholder}</span>
          <span className="text-[16px] text-[#3a3a3a]">▾</span>
        </button>
        <div
          className={`absolute left-0 right-0 z-30 origin-top rounded-b-[8px] border border-[#c9c9c9] bg-[#ffffff] shadow-lg transition-all duration-300 ease-out ${
            open ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100" : "pointer-events-none -translate-y-1 scale-y-95 opacity-0"
          }`}
          style={{ width: "347px" }}
        >
            <div className="relative p-1">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-[38px] w-full rounded-[4px] border border-[#5db0f7] bg-white px-4 pr-12 text-[16px] text-[#222] outline-none"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[34px] text-[#3a3a3a]">⌕</span>
            </div>
            <button
              type="button"
              className="block w-full cursor-pointer bg-[#4b91cf] px-4 py-2 text-left text-[16px] text-white"
              onClick={() => {
                onChange("");
                setOpenSelectId(null);
              }}
            >
              {placeholder}
            </button>
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                className="block w-full cursor-pointer px-4 py-2 text-left text-[16px] text-[#2f2f2f] hover:bg-[#e6eef7]"
                onClick={() => {
                  onChange(option);
                  setOpenSelectId(null);
                }}
              >
                {option}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function CourseRegistrationPage() {
  const router = useRouter();
  const [academicYear, setAcademicYear] = useState("");
  const [calendarSemester, setCalendarSemester] = useState("");
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const selectsWrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!selectsWrapperRef.current?.contains(event.target as Node)) {
        setOpenSelectId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    document.title = "Course Registration | Addis Ababa University";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <TopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] pr-[130px]">
        <div className="flex gap-5">
          <PortalSideMenu />

          <section className="ml-[130px] flex-1">
            

              <div className="px-2 py-1 text-[16px]">
                <div className="grid grid-cols-[180px_1fr_160px_1fr] gap-y-0 px-4">
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

                <div className="h-[1px] bg-[#e0e0e0] mt-[18px]"></div>

                <p className="mt-4 mb-2 text-[16px] font-semibold text-[#2f78b7]">Select academic period for registration</p>

                <div ref={selectsWrapperRef} className="grid grid-cols-2 gap-4">
                  <SearchSelect
                    id="academic-year"
                    label="Academic Year"
                    placeholder="Select academic year"
                    value={academicYear}
                    onChange={setAcademicYear}
                    options={["2025/26", "2024/25", "2023/24", "2022/23"]}
                    openSelectId={openSelectId}
                    setOpenSelectId={setOpenSelectId}
                  />
                  <SearchSelect
                    id="calendar-semester"
                    label="Calendar Semester"
                    placeholder="Select semester"
                    value={calendarSemester}
                    onChange={setCalendarSemester}
                    options={["One", "Two", "Three", "Summer Distance"]}
                    openSelectId={openSelectId}
                    setOpenSelectId={setOpenSelectId}
                  />
                </div>

                <div className="mt-8 flex justify-end mr-[210px]">
                  <button
                    type="button"
                    disabled={!academicYear || !calendarSemester}
                    className="rounded bg-[#2f78b7] px-6 py-2 text-[15px] font-semibold text-white enabled:hover:bg-[#255f93] disabled:cursor-not-allowed disabled:bg-[#9ab9d5]"
                    onClick={() =>
                      router.push(
                        `/portal/course-registration/registered?academicYear=${encodeURIComponent(academicYear)}&calendarSemester=${encodeURIComponent(calendarSemester)}`,
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
         
          </section>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
