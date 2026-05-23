import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Registration",
};

export default function CourseRegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
