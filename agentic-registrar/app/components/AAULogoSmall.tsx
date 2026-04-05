export default function AAULogoSmall() {
  return (
    <div className="flex items-center">
      <img
        src="/assets/logo.png"
        alt="Addis Ababa University"
        className="h-[40px] w-[40px] shrink-0"
      />

      <div className="ml-1 mr-2 h-[50px] w-[2px] shrink-0 bg-[#1f6fb3]" />

      <div className="leading-none">
        <div className="mb-1 text-[16px] tracking-wide text-[#1f6fb3]">
          አዲስ አበባ ዩኒቨርሲቲ
        </div>
        <div className="mt-2 text-[13px] font-bold tracking-wide text-[#e04b4b]">
          ADDIS ABABA UNIVERSITY
        </div>
      </div>
    </div>
  );
}
