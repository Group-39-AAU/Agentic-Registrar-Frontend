"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/lib/api";

export function AdmissionAfterLoginContent() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!getStoredAccessToken()) {
        router.replace("/admissions/login");
        return;
      }
      setReady(true);
    };
    sync();
    window.addEventListener("aau-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("aau-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-[520px] px-5 py-24 text-center text-[14px] text-[#5a5a5a]">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[520px] px-5 pb-16 pt-[100px]">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white px-8 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="text-[18px] font-semibold text-[#2a66a7]">Welcome back</div>
        <p className="mt-1 text-[12px] text-[#5a5a5a]">
          You are signed in. Open your applications or start a new one.
        </p>

        <div
          className="mt-5 rounded border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-800"
          role="status"
        >
          Logged in successfully. Use the links below to continue.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-stretch">
          <Link
            href="/admissions/my-admissions"
            className="flex h-[44px] flex-1 items-center justify-center rounded-md bg-[#3f79b5] text-[14px] font-semibold text-white transition-colors hover:bg-[#356e9f]"
          >
            My admissions
          </Link>
          <Link
            href="/admissions"
            className="flex h-[44px] flex-1 items-center justify-center rounded-md border-2 border-[#3f79b5] bg-white text-[14px] font-semibold text-[#3f79b5] transition-colors hover:bg-[#f0f6fc]"
          >
            Application
          </Link>
        </div>
      </div>
    </div>
  );
}
