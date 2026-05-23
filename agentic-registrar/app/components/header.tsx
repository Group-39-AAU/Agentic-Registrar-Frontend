"use client";

import Link from "next/link";
import { useState } from "react";
import { AdmissionDropdown } from "./AdmissionDropdown";
import AAULogoSmall from "./AAULogoSmall";

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      className="h-3 w-3 text-[#6a6a6a]"
      fill="currentColor"
    >
      <path d="M1.2 3.7a.9.9 0 0 1 1.3 0L5 6.2l2.5-2.5a.9.9 0 1 1 1.3 1.3L5.7 8a1 1 0 0 1-1.4 0L1.2 5a.9.9 0 0 1 0-1.3Z" />
    </svg>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  const navItems = (
    <>
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="flex items-center gap-0 px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 576 512"
          className="h-4 w-4 text-[#384457]"
          fill="currentColor"
        >
          <path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z" />
        </svg>
        <span className="ml-2">Home</span>
      </Link>
      <a
        href="#"
        className="px-3 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
      >
        Announcement
      </a>
      <AdmissionDropdown />
      <a
        href="#"
        className="flex items-center gap-1 px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
      >
        <span>Exams</span>
        <ChevronDown />
      </a>
      <a
        href="#"
        className="px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
      >
        Freshman
      </a>
      <a
        href="#"
        className="px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
      >
        Programs
      </a>
      <a
        href="#"
        className="px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
      >
        Calendar
      </a>
    </>
  );

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-4 md:h-[90px] md:py-0">
        <AAULogoSmall />

        <nav className="hidden md:ml-auto md:flex md:items-center md:gap-0">
          {navItems}
        </nav>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="grid h-9 w-9 place-items-center rounded text-[#384457] hover:bg-black/5 md:hidden"
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
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      <div
        className={`md:hidden overflow-hidden border-t border-gray-200 bg-white transition-[max-height,opacity] duration-300 ease-out ${
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-4 py-2">{navItems}</nav>
      </div>
    </header>
  );
}
