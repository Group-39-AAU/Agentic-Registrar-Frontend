"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import {
  fetchCourseTerms,
  fetchStudentMe,
  type CourseTerm,
  type StudentMeResponse,
} from "@/lib/api";

const ROMAN_YEAR = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function semesterToYear(currentSemester: number): string {
  if (!currentSemester || currentSemester < 1) return "";
  const year = Math.ceil(currentSemester / 2);
  return ROMAN_YEAR[year - 1] ?? String(year);
}

// TopStrip moved to shared component PortalTopStrip.

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
          className="flex w-full max-w-[347px] cursor-pointer items-center justify-between rounded-t-[4px] border border-[#c9c9c9] py-2 px-4 text-left text-[46px] text-[#353535] shadow-sm sm:text-[28px] md:w-[347px] md:text-[22px] lg:text-[44px] xl:text-[42px]"
        >
          <span className="text-[16px] sm:text-[20px] md:text-[16px] lg:text-[20px] xl:text-[16px]">{value || placeholder}</span>
          <span className="text-[16px] text-[#3a3a3a]">▾</span>
        </button>
        <div
          className={`absolute left-0 z-30 w-full max-w-[347px] origin-top rounded-b-[8px] border border-[#c9c9c9] bg-[#ffffff] shadow-lg transition-all duration-300 ease-out md:w-[347px] ${
            open ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100" : "pointer-events-none -translate-y-1 scale-y-95 opacity-0"
          }`}
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
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [academicYear, setAcademicYear] = useState("");
  const [calendarSemester, setCalendarSemester] = useState("");
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const [profile, setProfile] = useState<StudentMeResponse | null>(null);
  const [terms, setTerms] = useState<CourseTerm[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const selectsWrapperRef = useRef<HTMLDivElement | null>(null);

  const termsByYear = useMemo(() => {
    const groups = new Map<string, CourseTerm[]>();
    terms.forEach((term) => {
      const list = groups.get(term.term_name) ?? [];
      list.push(term);
      groups.set(term.term_name, list);
    });
    return groups;
  }, [terms]);

  const yearOptions = useMemo(() => Array.from(termsByYear.keys()), [termsByYear]);
  const phaseOptions = useMemo(() => {
    if (!academicYear) return [];
    return (termsByYear.get(academicYear) ?? []).map((term) => term.phase);
  }, [academicYear, termsByYear]);

  const selectedTerm = useMemo(() => {
    if (!academicYear || !calendarSemester) return null;
    return (
      (termsByYear.get(academicYear) ?? []).find(
        (term) => term.phase === calendarSemester,
      ) ?? null
    );
  }, [academicYear, calendarSemester, termsByYear]);

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
    let cancelled = false;
    fetchStudentMe()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // Keep placeholder values if the request fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCourseTerms()
      .then((data) => {
        if (!cancelled) setTerms(data);
      })
      .catch(() => {
        if (!cancelled) setTerms([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const yearLabel = profile ? semesterToYear(profile.current_semester) : "";

  function handleSemesterOpen(nextId: string | null) {
    if (nextId === "calendar-semester" && !academicYear) {
      setSelectionError("Please select the academic year first.");
      return;
    }
    setSelectionError(null);
    setOpenSelectId(nextId);
  }

  function handleAcademicYearChange(value: string) {
    setAcademicYear(value);
    setCalendarSemester("");
    setSelectionError(null);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] md:pr-[130px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 md:ml-[130px]">


              <div className="px-3 py-1 text-[16px] md:px-2">
                {justRegistered ? (
                  <div className="mb-4 flex items-center justify-center gap-2 rounded-md border border-[#b6e0bd] bg-[linear-gradient(180deg,#ecf8ef_0%,#dff1e4_100%)] px-4 py-3 text-center text-[16px] font-semibold text-[#1f7a3a] shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-14px_rgba(31,122,58,0.35)]">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-[#1f7a3a]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    Courses registered successfully.
                  </div>
                ) : null}

                <div className="grid grid-cols-[120px_1fr] gap-y-2 px-1 md:grid-cols-[180px_1fr_160px_1fr] md:px-4">
                  <p className="font-semibold">Full Name</p>
                  <p>{profile?.full_name ?? "—"}</p>
                  <p className="font-semibold">Class Year</p>
                  <p>{yearLabel ? `Year ${yearLabel} , Section` : "—"}</p>

                  <p className="font-semibold">ID No.</p>
                  <p>{profile?.student_id ?? "—"}</p>
                  <p className="font-semibold">Admission Type</p>
                  <p>Regular</p>

                  <p className="self-center font-semibold">Program</p>
                  <p className="w-[324px]">{profile?.department ?? "—"}</p>
                  <p className="font-semibold">Due Amount</p>
                  <p>-</p>
                </div>

                <div className="h-[1px] bg-[#e0e0e0] mt-[18px]"></div>

                <p className="mt-4 mb-2 text-[16px] font-semibold text-[#2f78b7]">Select academic period for registration</p>

                <div ref={selectsWrapperRef} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SearchSelect
                    id="academic-year"
                    label="Academic Year"
                    placeholder="Select academic year"
                    value={academicYear}
                    onChange={handleAcademicYearChange}
                    options={yearOptions}
                    openSelectId={openSelectId}
                    setOpenSelectId={handleSemesterOpen}
                  />
                  <SearchSelect
                    id="calendar-semester"
                    label="Calendar Semester"
                    placeholder="Select semester"
                    value={calendarSemester}
                    onChange={setCalendarSemester}
                    options={phaseOptions}
                    openSelectId={openSelectId}
                    setOpenSelectId={handleSemesterOpen}
                  />
                </div>

                {selectionError ? (
                  <p className="mt-3 text-[14px] font-semibold text-[#c0392b]">
                    {selectionError}
                  </p>
                ) : null}

                <div className="mt-8 flex justify-end md:mr-[210px]">
                  <button
                    type="button"
                    disabled={!selectedTerm}
                    className="rounded-md bg-[linear-gradient(180deg,#3a86c4_0%,#2f78b7_100%)] px-6 py-2 text-[15px] font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_8px_18px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 enabled:hover:bg-[linear-gradient(180deg,#2f78b7_0%,#255f93_100%)] enabled:hover:-translate-y-[1px] enabled:hover:shadow-[0_2px_0_rgba(255,255,255,0.2)_inset,0_14px_22px_-12px_rgba(31,91,148,0.85)] disabled:cursor-not-allowed disabled:bg-[#9ab9d5] disabled:shadow-none"
                    onClick={() => {
                      if (!selectedTerm) return;
                      router.push(
                        `/portal/course-registration/registered?academicYear=${encodeURIComponent(academicYear)}&calendarSemester=${encodeURIComponent(calendarSemester)}&termId=${encodeURIComponent(selectedTerm.id)}`,
                      );
                    }}
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
