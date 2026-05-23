import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Home",
};

export default function PortalHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
