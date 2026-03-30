import Link from "next/link";
import { AdmissionDropdown } from "./AdmissionDropdown";

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
  
  function AAULogoSmall() {
    return (
      <div className="flex items-center">
        <img
          src="/assets/logo.png"
          alt="Addis Ababa University"
          className="h-[40px] w-[40px] shrink-0"
        />
  
        <div className="h-[50px] w-[2px] shrink-0 bg-[#1f6fb3] ml-1 mr-2" />
  
        <div className="leading-none">
          <div className="text-[16px] tracking-wide text-[#1f6fb3] mb-1">
            አዲስ አበባ ዩኒቨርሲቲ
          </div>
          <div className="mt-2 text-[13px] font-bold tracking-wide text-[#e04b4b]">
            ADDIS ABABA UNIVERSITY
          </div>
        </div>
      </div>
    );
  }
  


export default function Header() {
  return (
    <header className="h-[70px] bg-white border-b border-gray-200 py-10">
    <div className="mx-auto flex h-full w-full max-w-[1180px] items-between px-5">
      <AAULogoSmall />

      <nav className="ml-auto flex items-center gap-0">
        <Link
          href="/"
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
      </nav>
    </div>
  </header>
  );
}