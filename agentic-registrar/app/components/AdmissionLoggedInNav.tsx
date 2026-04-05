"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearStoredAccessToken } from "@/lib/api";
import AAULogoSmall from "./AAULogoSmall";
import { AdmissionDropdown } from "./AdmissionDropdown";

export default function AdmissionLoggedInNav() {
  const router = useRouter();

  const handleLogout = () => {
    clearStoredAccessToken();
    window.dispatchEvent(new Event("aau-auth-changed"));
    router.replace("/");
  };

  return (
    <header className="h-[70px] border-b border-gray-200 bg-white py-10">
      <div className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-between px-5">
        <Link href="/admissions" className="shrink-0 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#2f76b7]">
          <AAULogoSmall />
        </Link>
        <div className="ml-auto flex items-center gap-0">
          <AdmissionDropdown />
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 text-base font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
