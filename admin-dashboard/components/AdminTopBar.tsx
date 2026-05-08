"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/applications", label: "Applications" },
  { href: "/ranking", label: "Ranking" },
  { href: "/review", label: "Review" },
  { href: "/flags", label: "Flags" },
  { href: "/enrollment", label: "Enrollment" },
];

function AAULogoSmall() {
  return (
    <div className="flex items-center">
      <img src="/assets/logo.png" alt="Addis Ababa University" className="h-[40px] w-[40px] shrink-0" />
      <div className="ml-1 mr-2 h-[50px] w-[2px] shrink-0 bg-[#1f6fb3]" />
      <div className="leading-none">
        <div className="mb-1 text-[16px] tracking-wide text-[#1f6fb3]">አዲስ አበባ ዩኒቨርሲቲ</div>
        <div className="mt-2 text-[13px] font-bold tracking-wide text-[#e04b4b]">
          ADDIS ABABA UNIVERSITY
        </div>
      </div>
    </div>
  );
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-[1180px] items-center px-5">
        <AAULogoSmall />

        <nav className="ml-auto flex items-center gap-6 text-[11px] font-semibold tracking-wide text-[#384457]">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`uppercase transition-colors ${
                  active ? "text-[#2f76b7]" : "hover:text-[#2f76b7]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("admin_dashboard_logged_in");
            router.push("/");
          }}
          className="ml-6 rounded border border-[#e04b4b] px-4 py-2 text-[12px] font-semibold text-[#e04b4b] transition-colors hover:bg-[#e04b4b]/5"
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
