"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };

const ADMISSION_LINKS: NavLink[] = [
  { href: "/applications", label: "Applications" },
  { href: "/flags", label: "Flagged Review" },
  { href: "/ranking", label: "Ranking" },
  { href: "/review", label: "Review" },
  { href: "/enrollment", label: "Enrollment" },
];

const COURSE_MANAGEMENT_HREF = "/officer";

const COURSE_MANAGEMENT_LINKS: NavLink[] = [
  { href: "/officer", label: "Operations" },
  { href: "/officer/terms", label: "Terms" },
  { href: "/officer/add-drop", label: "Add / Drop" },
  { href: "/officer/grading", label: "Grade Authorisation" },
  { href: "/officer/exceptions", label: "Exception Queue" },
];

function AAULogoSmall() {
  return (
    <div className="flex items-center">
      <img
        src="/assets/logo.png"
        alt="Addis Ababa University"
        className="h-[40px] w-[40px] shrink-0 drop-shadow-[0_3px_8px_rgba(31,91,148,0.25)]"
      />
      <div className="ml-2 mr-3 h-[44px] w-[2px] shrink-0 bg-[linear-gradient(180deg,transparent_0%,#1f6fb3_45%,transparent_100%)]" />
      <div className="leading-none">
        <div className="mb-1 text-[15px] tracking-wide text-[#1f6fb3]">
          አዲስ አበባ ዩኒቨርሲቲ
        </div>
        <div className="mt-2 text-[12px] font-bold tracking-[0.06em] text-[#e04b4b]">
          ADDIS ABABA UNIVERSITY
        </div>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [mobileAdmissionOpen, setMobileAdmissionOpen] = useState(false);
  const [mobileCourseOpen, setMobileCourseOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeCourseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const admissionActive = ADMISSION_LINKS.some((l) => pathname.startsWith(l.href));
  const courseManagementActive = pathname.startsWith(COURSE_MANAGEMENT_HREF);

  // Close hover dropdown if we navigate away
  useEffect(() => {
    setAdmissionOpen(false);
    setCourseOpen(false);
  }, [pathname]);

  function openAdmission() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setAdmissionOpen(true);
  }
  function scheduleCloseAdmission() {
    closeTimerRef.current = setTimeout(() => setAdmissionOpen(false), 120);
  }

  function openCourse() {
    if (closeCourseTimerRef.current) {
      clearTimeout(closeCourseTimerRef.current);
      closeCourseTimerRef.current = null;
    }
    setCourseOpen(true);
  }
  function scheduleCloseCourse() {
    closeCourseTimerRef.current = setTimeout(() => setCourseOpen(false), 120);
  }

  function handleLogout() {
    localStorage.removeItem("admin_dashboard_logged_in");
    localStorage.removeItem("admin_dashboard_token");
    router.push("/");
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_16px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] w-full max-w-[1180px] items-center px-5">
        <Link href="/applications" aria-label="Go to admissions">
          <AAULogoSmall />
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-[#384457] md:flex">
          {/* Admission dropdown */}
          <div
            className="relative"
            onMouseEnter={openAdmission}
            onMouseLeave={scheduleCloseAdmission}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={admissionOpen}
              onClick={() => setAdmissionOpen((v) => !v)}
              className={`relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 uppercase transition-colors ${
                admissionActive
                  ? "text-[#2f76b7]"
                  : "hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
              }`}
            >
              Admission
              <ChevronDown />
              {admissionActive ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-[18px] h-[2px] rounded-t bg-[linear-gradient(90deg,transparent,#2f76b7,transparent)]"
                />
              ) : null}
            </button>

            <div
              role="menu"
              aria-label="Admission menu"
              className={`absolute right-0 top-full z-50 mt-2 w-[200px] origin-top rounded-xl border border-[#d4dbe2] bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fa_100%)] p-1.5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35),0_2px_8px_-4px_rgba(15,23,42,0.18)] transition-[opacity,clip-path,transform] duration-300 ease-out ${
                admissionOpen
                  ? "pointer-events-auto translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]"
                  : "pointer-events-none -translate-y-1 opacity-0 [clip-path:inset(0_0_100%_0)]"
              }`}
            >
              {ADMISSION_LINKS.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setAdmissionOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
                      active
                        ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                        : "text-[#384457] hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Course Management dropdown */}
          <div
            className="relative"
            onMouseEnter={openCourse}
            onMouseLeave={scheduleCloseCourse}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={courseOpen}
              onClick={() => setCourseOpen((v) => !v)}
              className={`relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 uppercase transition-colors ${
                courseManagementActive
                  ? "text-[#2f76b7]"
                  : "hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
              }`}
            >
              Course Management
              <ChevronDown />
              {courseManagementActive ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 -bottom-[18px] h-[2px] rounded-t bg-[linear-gradient(90deg,transparent,#2f76b7,transparent)]"
                />
              ) : null}
            </button>

            <div
              role="menu"
              aria-label="Course management menu"
              className={`absolute right-0 top-full z-50 mt-2 w-[220px] origin-top rounded-xl border border-[#d4dbe2] bg-[linear-gradient(180deg,#ffffff_0%,#f5f7fa_100%)] p-1.5 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35),0_2px_8px_-4px_rgba(15,23,42,0.18)] transition-[opacity,clip-path,transform] duration-300 ease-out ${
                courseOpen
                  ? "pointer-events-auto translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]"
                  : "pointer-events-none -translate-y-1 opacity-0 [clip-path:inset(0_0_100%_0)]"
              }`}
            >
              {COURSE_MANAGEMENT_LINKS.map((link) => {
                const active =
                  link.href === COURSE_MANAGEMENT_HREF
                    ? pathname === COURSE_MANAGEMENT_HREF
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setCourseOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
                      active
                        ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                        : "text-[#384457] hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="ml-4 hidden rounded-md border border-[#e04b4b]/70 bg-white px-4 py-2 text-[12px] font-semibold tracking-wide text-[#e04b4b] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#e04b4b]/[0.06] hover:shadow-[0_8px_18px_-12px_rgba(224,75,75,0.7)] md:inline-flex"
        >
          LOGOUT
        </button>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="ml-auto grid h-9 w-9 place-items-center rounded-md text-[#384457] hover:bg-black/5 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden border-t border-gray-100 bg-white transition-[max-height,opacity] duration-300 ease-out ${
          mobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 py-2">
          {/* Admission group */}
          <div>
            <button
              type="button"
              onClick={() => setMobileAdmissionOpen((v) => !v)}
              aria-expanded={mobileAdmissionOpen}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                admissionActive
                  ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                  : "text-[#384457] hover:bg-black/[0.03]"
              }`}
            >
              <span>Admission</span>
              <span
                className={`transition-transform duration-200 ${
                  mobileAdmissionOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDown />
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                mobileAdmissionOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <ul className="ml-2 mt-1 border-l border-gray-200 pl-2">
                {ADMISSION_LINKS.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-md px-3 py-2 text-[12.5px] uppercase tracking-[0.06em] transition-colors ${
                          active
                            ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                            : "text-[#384457] hover:bg-black/[0.03]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Course Management group */}
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setMobileCourseOpen((v) => !v)}
              aria-expanded={mobileCourseOpen}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                courseManagementActive
                  ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                  : "text-[#384457] hover:bg-black/[0.03]"
              }`}
            >
              <span>Course Management</span>
              <span
                className={`transition-transform duration-200 ${
                  mobileCourseOpen ? "rotate-180" : ""
                }`}
              >
                <ChevronDown />
              </span>
            </button>
            <div
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
                mobileCourseOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <ul className="ml-2 mt-1 border-l border-gray-200 pl-2">
                {COURSE_MANAGEMENT_LINKS.map((link) => {
                  const active =
                    link.href === COURSE_MANAGEMENT_HREF
                      ? pathname === COURSE_MANAGEMENT_HREF
                      : pathname.startsWith(link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-md px-3 py-2 text-[12.5px] uppercase tracking-[0.06em] transition-colors ${
                          active
                            ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                            : "text-[#384457] hover:bg-black/[0.03]"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              handleLogout();
            }}
            className="mt-2 rounded-md border border-[#e04b4b]/70 bg-white px-3 py-2 text-[12px] font-semibold tracking-wide text-[#e04b4b] hover:bg-[#e04b4b]/[0.06]"
          >
            LOGOUT
          </button>
        </nav>
      </div>
    </header>
  );
}
