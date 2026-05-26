"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const GRADING_HREF = "/officer/grading";
const STANDING_HREF = "/officer/standing";
const SCHEDULING_HREF = "/officer";
const ADD_DROP_HREF = "/officer/add-drop";

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

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const gradingActive = pathname.startsWith(GRADING_HREF);
  const standingActive = pathname.startsWith(STANDING_HREF);
  const addDropActive = pathname.startsWith(ADD_DROP_HREF);
  // Match /officer and /officer/sections/* but NOT the other named tabs.
  const schedulingActive =
    (pathname === SCHEDULING_HREF || pathname.startsWith("/officer/sections")) &&
    !gradingActive &&
    !standingActive &&
    !addDropActive;

  function handleLogout() {
    localStorage.removeItem("admin_dashboard_logged_in");
    localStorage.removeItem("admin_dashboard_token");
    router.push("/");
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_4px_16px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] w-full max-w-[1180px] items-center px-5">
        <Link href={SCHEDULING_HREF} aria-label="Scheduling">
          <AAULogoSmall />
        </Link>

        <span className="ml-4 hidden rounded-full bg-[#2f76b7]/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f76b7] md:inline-block">
          Department Head
        </span>

        {/* Desktop nav */}
        <nav className="ml-auto hidden items-center gap-1 text-[11px] font-semibold tracking-[0.08em] text-[#384457] md:flex">
          <Link
            href={SCHEDULING_HREF}
            className={`relative inline-flex items-center rounded-md px-3 py-2 uppercase transition-colors ${
              schedulingActive
                ? "text-[#2f76b7]"
                : "hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
            }`}
          >
            Scheduling
            {schedulingActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-[18px] h-[2px] rounded-t bg-[linear-gradient(90deg,transparent,#2f76b7,transparent)]"
              />
            ) : null}
          </Link>
          <Link
            href={ADD_DROP_HREF}
            className={`relative inline-flex items-center rounded-md px-3 py-2 uppercase transition-colors ${
              addDropActive
                ? "text-[#2f76b7]"
                : "hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
            }`}
          >
            Add / Drop
            {addDropActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-[18px] h-[2px] rounded-t bg-[linear-gradient(90deg,transparent,#2f76b7,transparent)]"
              />
            ) : null}
          </Link>
          <Link
            href={GRADING_HREF}
            className={`relative inline-flex items-center rounded-md px-3 py-2 uppercase transition-colors ${
              gradingActive
                ? "text-[#2f76b7]"
                : "hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
            }`}
          >
            Grade Authorisation
            {gradingActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-[18px] h-[2px] rounded-t bg-[linear-gradient(90deg,transparent,#2f76b7,transparent)]"
              />
            ) : null}
          </Link>
          <Link
            href={STANDING_HREF}
            className={`relative inline-flex items-center rounded-md px-3 py-2 uppercase transition-colors ${
              standingActive
                ? "text-[#2f76b7]"
                : "hover:bg-[#2f76b7]/[0.06] hover:text-[#2f76b7]"
            }`}
          >
            Academic Standing
            {standingActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 -bottom-[18px] h-[2px] rounded-t bg-[linear-gradient(90deg,transparent,#2f76b7,transparent)]"
              />
            ) : null}
          </Link>
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
          <Link
            href={SCHEDULING_HREF}
            onClick={() => setMobileOpen(false)}
            className={`rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
              schedulingActive
                ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                : "text-[#384457] hover:bg-black/[0.03]"
            }`}
          >
            Scheduling
          </Link>
          <Link
            href={ADD_DROP_HREF}
            onClick={() => setMobileOpen(false)}
            className={`mt-1 rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
              addDropActive
                ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                : "text-[#384457] hover:bg-black/[0.03]"
            }`}
          >
            Add / Drop
          </Link>
          <Link
            href={GRADING_HREF}
            onClick={() => setMobileOpen(false)}
            className={`mt-1 rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
              gradingActive
                ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                : "text-[#384457] hover:bg-black/[0.03]"
            }`}
          >
            Grade Authorisation
          </Link>
          <Link
            href={STANDING_HREF}
            onClick={() => setMobileOpen(false)}
            className={`mt-1 rounded-md px-3 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${
              standingActive
                ? "bg-[#2f76b7]/[0.08] text-[#2f76b7]"
                : "text-[#384457] hover:bg-black/[0.03]"
            }`}
          >
            Academic Standing
          </Link>

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
