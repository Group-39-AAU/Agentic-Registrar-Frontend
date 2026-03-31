import Link from "next/link";

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

export function AdmissionDropdown() {
  return (
    <div className="group relative">
      <div
        className="flex cursor-default items-center gap-1 px-2 py-2 text-base font-normal text-[#384457] group-hover:text-[#2f76b7]"
        aria-haspopup="true"
        aria-label="Admission menu"
      >
        <span>Admission</span>
        <ChevronDown />
      </div>
      {/* pt-2 bridges the gap so the pointer can move from the label to the menu without closing */}
      <div className="pointer-events-none invisible absolute left-0 top-full z-[100] min-w-[220px] pt-2 opacity-0 transition-opacity duration-75 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
        <div
          role="menu"
          className="rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          <Link
            role="menuitem"
            href="/admissions"
            className="block px-4 py-2.5 text-sm text-[#384457] hover:bg-gray-50 hover:text-[#2f76b7]"
          >
            Apply for Admission
          </Link>
          <Link
            role="menuitem"
            href="/admissions/my-admissions"
            className="block px-4 py-2.5 text-sm text-[#384457] hover:bg-gray-50 hover:text-[#2f76b7]"
          >
            Admission Status
          </Link>
        </div>
      </div>
    </div>
  );
}
