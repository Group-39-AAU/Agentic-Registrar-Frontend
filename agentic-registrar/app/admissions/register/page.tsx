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

      <main className="mx-auto w-full max-w-[800px] px-5 pb-16 pt-[100px]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="bg-[#3f79b5] px-8 py-6 text-white">
            <h1 className="text-[24px] font-bold">Undergraduate Registration</h1>
            <p className="mt-1 text-[14px] text-white/80">
              Create your account to start your undergraduate application.
            </p>
          </div>
          
          <div className="px-8 py-10">
            <RegistrationForm />
          </div>
        </div>
        
        <div className="mt-8 text-center text-[12px] text-[#5a5a5a]">
          <p>© 2026 Addis Ababa University. For assistance, contact our support team.</p>
        </div>
      </main>
    </div>
  );
}
