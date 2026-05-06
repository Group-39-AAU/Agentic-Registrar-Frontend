import AdminReviewDetailClient from "@/components/AdminReviewDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminReviewDetailClient applicationId={id} />;
}
