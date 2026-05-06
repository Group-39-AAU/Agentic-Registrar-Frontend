import AdminAdmissionDetailClient from "@/components/AdminAdmissionDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function AdminApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminAdmissionDetailClient applicationId={id} />;
}
