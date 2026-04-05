import AdmissionsLayoutClient from "./AdmissionsLayoutClient";

export default function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdmissionsLayoutClient>{children}</AdmissionsLayoutClient>;
}
