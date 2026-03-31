import type { Metadata } from "next";
import Header from "../../components/header";
import RegistrationForm from "../../../components/RegistrationForm";

export const metadata: Metadata = {
  title: "Undergraduate Registration | AAU",
  description: "Create an applicant account for Addis Ababa University undergraduate programs.",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Header />

      <main className="mx-auto w-full max-w-[1100px] px-5 pb-16 pt-[100px]">
        <h1 className="mb-8 text-center text-[20px] font-bold text-[#2f76b7]">
          Create Undergraduate Applicant Account
        </h1>

        <div className="overflow-hidden rounded-md border border-gray-100 bg-white px-10 py-10 shadow-[0_2px_15px_rgba(0,0,0,0.05)]">
          <div className="mb-8 rounded-sm border-l-[4px] border-[#e04b4b] bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <h2 className="text-[14px] font-bold text-green-600">Admissions Update</h2>
            <p className="text-[13px] font-medium text-green-600">
              Undergraduate Application is Open!
            </p>
          </div>

          <RegistrationForm />
        </div>

        <div className="mt-8 text-center text-[12px] text-[#5a5a5a]">
          <p>© 2026 Addis Ababa University. For assistance, contact our support team.</p>
        </div>
      </main>
    </div>
  );
}
