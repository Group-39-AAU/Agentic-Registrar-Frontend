import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Add / Drop",
};

export default function CourseAddDropLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
