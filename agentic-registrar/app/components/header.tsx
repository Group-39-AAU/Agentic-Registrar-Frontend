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

      <nav className="ml-auto flex items-center gap-6">
        <Link
          href="#"
          className="text-[12px] font-semibold uppercase tracking-wide text-[#384457] hover:text-[#2f76b7]"
        >
          HOW TO APPLY
        </Link>
        <div className="flex items-center gap-1 cursor-pointer group">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#384457] group-hover:text-[#2f76b7]">
            UNDERGRADUATE
          </span>
          <ChevronDown />
        </div>
        <div className="flex items-center gap-1 cursor-pointer group">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-[#384457] group-hover:text-[#2f76b7]">
            GRADUATE
          </span>
          <ChevronDown />
        </div>
        <Link
          href="#"
          className="text-[12px] font-semibold uppercase tracking-wide text-[#384457] hover:text-[#2f76b7]"
        >
          FAQs
        </Link>
        <Link
          href="/"
          className="ml-2 flex h-[34px] w-[80px] items-center justify-center rounded-md border border-[#e04b4b] text-[12px] font-bold text-[#384457] transition-colors hover:bg-[#e04b4b] hover:text-white"
        >
          LOGIN
        </Link>
      </nav>
    </div>
  </header>
  );
}