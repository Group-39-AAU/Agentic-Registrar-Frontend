import type { Metadata } from "next";
import AdmissionApplyClient from "../../../components/AdmissionApplyClient";

export const metadata: Metadata = {
  title: "Undergraduate Admission Application | AAU",
  description: "Apply for undergraduate programs at Addis Ababa University.",
};

export default function ApplyPage() {

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <main className="mx-auto w-full max-w-[900px] px-5 pb-16 pt-[100px]">
        <AdmissionApplyClient />

        <div className="mt-8 text-center text-[12px] text-[#5a5a5a]">
          <p>© 2026 Addis Ababa University Registrar Office. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
