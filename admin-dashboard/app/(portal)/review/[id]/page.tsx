import type { Metadata } from "next";
import AdminReviewDetailClient from "@/components/AdminReviewDetailClient";

export const metadata: Metadata = { title: "Review Detail" };

type Props = { params: Promise<{ id: string }> };

export default async function ReviewDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminReviewDetailClient applicationId={id} />;
}
