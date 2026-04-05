import type { Metadata } from "next";
import AdmissionApplicationForm from "../../../components/AdmissionApplicationForm";

export const metadata: Metadata = {
  title: "Undergraduate Admission Application | AAU",
  description: "Apply for undergraduate programs at Addis Ababa University.",
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <main className="mx-auto w-full max-w-[900px] px-5 pb-16 pt-[100px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-[#1a1a1a]">Admission Application</h1>
            <p className="text-[14px] text-[#5a5a5a]">
              Please fill in all the required details to complete your application.
            </p>
          </div>
          <div className="rounded-full bg-white px-4 py-1 text-[12px] font-bold text-[#2f76b7] shadow-sm border border-gray-200">
            Term: 2016 E.C / 2024 G.C
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="px-10 py-10">
            <AdmissionApplicationForm />
          </div>
        </div>

        <div className="mt-8 text-center text-[12px] text-[#5a5a5a]">
          <p>© 2026 Addis Ababa University Registrar Office. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
