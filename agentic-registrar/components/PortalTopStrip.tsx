

export default function PortalTopStrip() {
  return (
    <div className="relative border-b border-[#b8c7d5] bg-[linear-gradient(90deg,#eef4f8_0%,#d8e8f5_100%)] py-1 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_2px_6px_-4px_rgba(15,23,42,0.18)]">
      <div className="mx-auto flex h-auto max-w-[1200px] items-center px-4 py-3 md:mx-[70px] md:h-[96px] md:px-6 md:py-0">
        <a
          href="/portal/home"
          className="shrink-0 outline-none transition-transform duration-300 hover:scale-[1.03]"
        >
          <img
            src="/assets/logo.png"
            alt="AAU"
            className="h-[60px] w-[60px] drop-shadow-[0_4px_10px_rgba(15,23,42,0.18)] md:h-[100px] md:w-[100px]"
          />
        </a>
        <div className="ml-3 md:ml-4">
          <p className="text-[14px] font-semibold leading-tight tracking-[0.04em] text-[#cf2e2e] md:text-[25px] md:leading-none md:tracking-[0.08em]">
            ADDIS ABABA UNIVERSITY
          </p>
          <p className="mt-1 text-[12px] font-bold leading-tight text-[#cf2e2e] md:ml-12 md:text-[20px] md:leading-none">
            አዲስ አበባ ዩኒቨርሲቲ
          </p>
          <p className="mt-1 hidden text-[16px] italic text-[#4a5a6a] md:ml-32 md:block">
            Seek wisdom, Elevate Your Intellect and Serve Humanity
          </p>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,transparent_0%,rgba(207,46,46,0.55)_50%,transparent_100%)]"
      />
    </div>
  );
}
