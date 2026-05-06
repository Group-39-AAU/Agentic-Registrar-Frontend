export default function AdminFooter() {
  return (
    <footer className="mt-12 bg-[#3f79b5]">
      <div className="mx-auto w-full max-w-[1024px] px-5 py-10">
        <div className="flex items-start justify-between gap-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="grid h-[54px] w-[54px] place-items-center rounded-full border-[2px] border-white/80">
              <img src="/assets/logo.png" alt="AAU Emblem" className="h-[46px] w-[46px]" />
            </div>
            <div className="text-[12px] leading-tight text-white/90">
              <div className="font-semibold">ADDIS ABABA UNIVERSITY</div>
              <div className="text-[10px] text-white/70">All rights reserved.</div>
            </div>
          </div>

          <div className="flex w-[320px] flex-col items-center justify-center text-white">
            <div className="text-[16px] font-semibold">Admin Portal</div>
            <div className="mt-2 text-[12px] text-white/90">Undergraduate Admissions Dashboard</div>
          </div>

          <div className="flex w-[220px] flex-col items-center justify-center text-white">
            <div className="text-[16px] font-semibold">Contact</div>
            <div className="mt-2 text-[12px] text-white/90">registrar@aau.edu.et</div>
          </div>
        </div>

        <div className="mt-8 text-center text-[10px] text-white/70">
          © 2026 - Addis Ababa University. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
