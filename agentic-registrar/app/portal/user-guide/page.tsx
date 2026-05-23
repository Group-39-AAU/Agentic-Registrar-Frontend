"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="User Guide"
      subtitle="Quick reference for using the student portal"
      variant="info"
      intro="The portal documentation covers everything from first-time login to filing a complaint. Bookmark this page; the PDF below is a printable copy."
      cards={[
        { title: "First login", body: "Use the UGR ID + 4-digit PIN emailed by the registrar. You'll be prompted to set a permanent password before reaching any other page." },
        { title: "Course registration", body: "Open Registration → Course Registration. Pick courses for your current semester, then submit. The compliance agent flags prereqs and credit limits." },
        { title: "Add / drop", body: "Once registered, open Registration → Course Add/Drop. Pick courses from your catalog OR re-add previously dropped ones." },
        { title: "Grade report & standing", body: "Grade & Results → Grade Report shows your transcript; Grade & Results → Academic Standing shows your current status." },
        { title: "Trouble logging in", body: "Use Forgot Password on the login screen. If your email isn't on file, contact the registrar to update it." },
      ]}
      ctaLabel="Download printable guide"
    />
  );
}
