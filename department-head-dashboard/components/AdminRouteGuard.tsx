"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem("admin_dashboard_logged_in") === "true";
    if (!ok) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
    