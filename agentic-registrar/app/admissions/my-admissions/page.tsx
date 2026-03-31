import type { Metadata } from "next";
import Header from "../../components/header";

export const metadata: Metadata = {
  title: "My admissions | AAU",
  description: "View and manage your Addis Ababa University admission applications.",
};

export default function MyAdmissionsPage() {
  return (
    <div className="min-h-screen bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Header />

      <main className="mx-auto w-full max-w-[1150px] px-5 pb-16 pt-10">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">My admissions</h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#3a3a3a]">
          Track applications you have started or submitted. When you begin a
          new application from{" "}
          <span className="font-semibold text-[#2f76b7]">Start admission</span>,
          it will appear here.
        </p>

        <div className="mt-10 rounded-lg border border-dashed border-[#9bb0cc] bg-[#f8fafc] px-6 py-12 text-center text-[14px] text-[#5a5a5a]">
          No applications yet. Use{" "}
          <span className="font-semibold text-[#2f76b7]">Admission → Apply for Admission</span>{" "}
          to begin.
        </div>
      </main>
    </div>
  );
}
