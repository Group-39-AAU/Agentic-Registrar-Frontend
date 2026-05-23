"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SectionIndexRedirect() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    const qs = searchParams.toString();
    router.replace(
      `/officer/sections/${encodeURIComponent(id)}/schedule${qs ? `?${qs}` : ""}`,
    );
  }, [params, searchParams, router]);

  return null;
}
