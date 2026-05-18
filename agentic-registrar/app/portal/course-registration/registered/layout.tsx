import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registered Courses",
};

export default function RegisteredCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
