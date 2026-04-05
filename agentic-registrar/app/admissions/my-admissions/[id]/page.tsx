import type { Metadata } from "next";
import Link from "next/link";
import AdmissionDetailClient from "@/components/AdmissionDetailClient";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Application ${id.slice(0, 8)}… | My admissions`,
    description: "View your undergraduate admission application details.",
  };
}

export default async function AdmissionDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <main className="mx-auto w-full max-w-[900px] px-5 pb-16 pt-8">
        <p className="mb-6">
          <Link
            href="/admissions/my-admissions"
            className="text-[13px] font-medium text-[#2f76b7] underline underline-offset-2 hover:text-[#2563a8]"
          >
            ← Back to My admissions
          </Link>
        </p>

        <AdmissionDetailClient applicationId={id} />

        <div className="mt-10 text-center text-[12px] text-[#5a5a5a]">
          <p>© 2026 Addis Ababa University. For assistance, contact our support team.</p>
        </div>
      </main>
    </div>
  );
}
