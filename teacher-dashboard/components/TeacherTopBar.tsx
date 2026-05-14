"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { id: "home", href: "/home", label: "Home" },
  { id: "courses", href: "/courses", label: "My courses" },
  { id: "grades", href: "/courses", label: "Enter grades" },
  { id: "submissions", href: "/submissions", label: "Submissions" },
] as const;

function isNavActive(id: string, pathname: string): boolean {
  if (id === "home") return pathname === "/home";
  if (id === "courses") return pathname === "/courses";
  if (id === "grades") return pathname.startsWith("/grades");
  if (id === "submissions") return pathname.startsWith("/submissions");
  return false;
}

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

export default function TeacherTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-[1180px] items-center px-5">
        <Link href="/home" className="flex items-center">
          <AAULogoSmall />
        </Link>

        <span className="ml-4 hidden rounded-full border border-[#cfe0f5] bg-[#f0f7ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2f76b7] sm:inline">
          Teacher
        </span>

        <nav className="ml-auto flex flex-wrap items-center justify-end gap-4 text-[11px] font-semibold tracking-wide text-[#384457] sm:gap-6">
          {navItems.map((item) => {
            const active = isNavActive(item.id, pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`uppercase transition-colors ${active ? "text-[#2f76b7]" : "hover:text-[#2f76b7]"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("teacher_dashboard_logged_in");
            localStorage.removeItem("teacher_dashboard_token");
            router.push("/");
          }}
          className="ml-4 rounded border border-[#e04b4b] px-3 py-2 text-[11px] font-semibold text-[#e04b4b] transition-colors hover:bg-[#e04b4b]/5 sm:ml-6 sm:px-4 sm:text-[12px]"
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
}
