"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TeacherRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ok = localStorage.getItem("teacher_dashboard_logged_in") === "true";
    if (!ok) {
      router.replace("/");
      return;
    }
    setTimeout(() => setReady(true), 0);
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
