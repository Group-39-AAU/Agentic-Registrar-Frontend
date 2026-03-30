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

export function SiteTopBar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="mx-auto flex h-[64px] w-full max-w-[1180px] items-center px-5">
        <AAULogoSmall />

        <nav className="ml-auto flex items-center gap-7 text-[11px] font-semibold tracking-wide text-[#384457]">
          <a
            href="#"
            className="uppercase hover:text-[#2f76b7] transition-colors"
          >
            HOW TO APPLY
          </a>
          <a
            href="#"
            className="flex items-center gap-1 uppercase hover:text-[#2f76b7] transition-colors"
          >
            <span>UNDERGRADUATE</span>
            <ChevronDown />
          </a>
          <a
            href="#"
            className="flex items-center gap-1 uppercase hover:text-[#2f76b7] transition-colors"
          >
            <span>GRADUATE</span>
            <ChevronDown />
          </a>
          <a
            href="#"
            className="uppercase hover:text-[#2f76b7] transition-colors"
          >
            FAQs
          </a>
        </nav>

        <a
          href="#"
          className="ml-6 rounded border border-[#e04b4b] px-4 py-2 text-[12px] font-semibold text-[#e04b4b] hover:bg-[#e04b4b]/5 transition-colors"
        >
          LOGIN
        </a>
      </div>
    </header>
  );
}
