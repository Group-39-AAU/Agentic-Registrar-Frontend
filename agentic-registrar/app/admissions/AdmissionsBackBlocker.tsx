"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getStoredAccessToken } from "@/lib/api";

/**
 * While the user has a session token, intercepts browser Back and steps
 * forward again so history cannot move backward (e.g. to register/login).
 * Uses useLayoutEffect so the listener is armed before the first paint after
 * navigation (e.g. login → /admissions/after-login).
 */
export function AdmissionsBackBlocker() {
  const [armed, setArmed] = useState(false);
  const skippingRef = useRef(false);

  useLayoutEffect(() => {
    const sync = () => setArmed(!!getStoredAccessToken());
    sync();
    window.addEventListener("aau-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aau-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!armed) return;

    const onPopState = () => {
      if (skippingRef.current) return;
      skippingRef.current = true;
      setTimeout(() => {
        try {
          window.history.go(1);
        } catch {
          /* ignore */
        }
        skippingRef.current = false;
      }, 0);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [armed]);

  return null;
}
