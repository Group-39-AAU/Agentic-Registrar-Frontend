import type { Metadata } from "next";
import AdminAdmissionDetailClient from "@/components/AdminAdmissionDetailClient";

export const metadata: Metadata = { title: "Application Detail" };

type Props = { params: Promise<{ id: string }> };

export default async function AdminApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminAdmissionDetailClient applicationId={id} />;
}
