import type { Metadata } from "next";
import MyAdmissionsList from "../../../components/MyAdmissionsList";

export const metadata: Metadata = {
  title: "My admissions | AAU",
  description: "View and manage your Addis Ababa University admission applications.",
};

export default function MyAdmissionsPage() {
  return (
    <div className="min-h-screen bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <main className="mx-auto w-full max-w-[1150px] px-5 pb-16 pt-10">
        <h1 className="text-[22px] font-bold text-[#2a66a7]">My admissions</h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-[#3a3a3a]">
          Applications linked to your account from the undergraduate portal.
        </p>

        <MyAdmissionsList />
      </main>
    </div>
  );
}
