import type { Metadata } from "next";
import Link from "next/link";
import AdmissionLoginForm from "@/components/AdmissionLoginForm";
import { AdmissionLoginRedirect } from "@/components/AdmissionLoginRedirect";

export const metadata: Metadata = {
  title: "Applicant Login | AAU Admissions",
  description:
    "Sign in to your Addis Ababa University undergraduate admissions account.",
};

export default function AdmissionLoginPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <AdmissionLoginRedirect />
      <main className="mx-auto w-full max-w-[480px] px-5 pb-16 pt-[100px]">
        <p className="mb-6 text-center text-[13px] text-[#5a5a5a]">
          <Link
            href="/admissions"
            className="font-medium text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
          >
            ← Back to Admissions
          </Link>
        </p>

        <AdmissionLoginForm />

        <div className="mt-8 text-center text-[12px] text-[#5a5a5a]">
          <p>© 2026 Addis Ababa University. For assistance, contact our support team.</p>
        </div>
      </main>
    </div>
  );
}
