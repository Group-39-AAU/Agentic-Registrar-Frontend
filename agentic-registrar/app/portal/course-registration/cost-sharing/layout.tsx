import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cost Sharing",
};

export default function CostSharingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
