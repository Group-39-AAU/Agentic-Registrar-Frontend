import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Report",
};

export default function GradeReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
