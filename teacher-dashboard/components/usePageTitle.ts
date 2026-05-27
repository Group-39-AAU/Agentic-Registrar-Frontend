"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title to "<name> | Addis Ababa University" for the
 * lifetime of the calling component. Used by client-component pages where
 * Next.js's static `export const metadata` isn't available.
 */
export function usePageTitle(name: string): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = `${name} | Addis Ababa University`;
  }, [name]);
}
