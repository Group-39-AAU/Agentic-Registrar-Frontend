"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/api";

/**
 * Links to /admissions/apply when logged in, otherwise /admissions/register.
 */
export function AdmissionApplyLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState("/admissions/register");

  useEffect(() => {
    const update = () =>
      setHref(
        getStoredAccessToken() ? "/admissions/apply" : "/admissions/register"
      );
    update();
    window.addEventListener("aau-auth-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("aau-auth-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
