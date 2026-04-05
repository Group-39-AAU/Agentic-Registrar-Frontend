import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Payment complete | AAU Admissions",
  description: "Your application payment has been processed.",
};

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <main className="mx-auto w-full max-w-[560px] px-5 pb-16 pt-[100px]">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white px-10 py-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-[24px] font-bold text-[#1a1a1a]">
            All set!
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5a5a5a]">
            Your payment was recorded and your application has been finalized.
            You can review your submission anytime under My admissions.
          </p>
          <Link
            href="/admissions/my-admissions"
            className="mt-10 inline-flex h-[44px] min-w-[200px] items-center justify-center rounded-md bg-[#3f79b5] px-8 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-[#356e9f]"
          >
            Go to My admissions
          </Link>
        </div>
        <p className="mt-10 text-center text-[12px] text-[#5a5a5a]">
          © 2026 Addis Ababa University Registrar Office.
        </p>
      </main>
    </div>
  );
}
