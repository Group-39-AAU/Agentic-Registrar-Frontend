"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { getStoredAccessToken } from "@/lib/api";
import Header from "../components/header";
import AdmissionLoggedInNav from "../components/AdmissionLoggedInNav";
import { AdmissionsBackBlocker } from "./AdmissionsBackBlocker";

export default function AdmissionsLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const [loggedIn, setLoggedIn] = useState(false);

  const sync = useCallback(() => {
    setLoggedIn(!!getStoredAccessToken());
  }, []);

  useLayoutEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    window.addEventListener("aau-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aau-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return (
    <>
      <AdmissionsBackBlocker />
      {loggedIn ? <AdmissionLoggedInNav /> : <Header />}
      {children}
    </>
  );
}
