import type { Metadata } from "next";
import { AdmissionAfterLoginContent } from "@/components/AdmissionAfterLoginContent";

export const metadata: Metadata = {
  title: "Signed in | AAU Admissions",
  description:
    "Continue to your admission application or view your applications.",
};

export default function AfterLoginPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <AdmissionAfterLoginContent />
      <div className="mx-auto max-w-[520px] px-5 pb-16 text-center text-[12px] text-[#5a5a5a]">
        <p>© 2026 Addis Ababa University. For assistance, contact our support team.</p>
      </div>
    </div>
  );
}
