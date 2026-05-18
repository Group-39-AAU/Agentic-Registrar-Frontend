import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Schedule",
};

export default function MyScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
