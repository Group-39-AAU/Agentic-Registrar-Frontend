import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Basic Information",
};

export default function BasicInformationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
