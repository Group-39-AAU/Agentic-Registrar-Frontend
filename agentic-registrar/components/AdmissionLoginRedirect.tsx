"use client";

import { useEffect } from "react";
import { getStoredAccessToken } from "@/lib/api";

/**
 * If the user is already signed in, replace this history entry so Back
 * from /admissions/after-login does not leave them on the login screen.
 */
export function AdmissionLoginRedirect() {
  useEffect(() => {
    if (getStoredAccessToken()) {
      window.location.replace("/admissions/after-login");
    }
  }, []);

  return null;
}
