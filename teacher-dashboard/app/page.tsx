"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import TeacherFooter from "@/components/TeacherFooter";

function LoginTopBrand() {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center px-5">
        <Image src="/assets/logo.png" alt="AAU" width={44} height={44} className="h-11 w-11" />
        <div className="ml-3 mr-3 h-[44px] w-[2px] bg-[#1f6fb3]" />
        <div className="leading-none">
          <div className="mb-1 text-[15px] tracking-wide text-[#1f6fb3]">አዲስ አበባ ዩኒቨርሲቲ</div>
          <div className="text-[12px] font-bold tracking-wide text-[#e04b4b]">ADDIS ABABA UNIVERSITY</div>
        </div>
      </div>
    </header>
  );
}

export default function TeacherLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <LoginTopBrand />
      <main className="mx-auto flex w-full max-w-[460px] flex-1 items-center px-5 py-8">
        <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="mb-5 text-center">
            <Image src="/assets/logo.png" alt="AAU" width={52} height={52} className="mx-auto h-13 w-13" />
            <h1 className="mt-3 text-[24px] font-bold text-[#2a66a7]">Teacher login</h1>
            <p className="text-[13px] text-[#5a5a5a]">
              UI preview with static data only — use any username and password to continue.
            </p>
          </div>

          {error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </p>
          ) : null}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (!username.trim() || !password.trim()) {
                setError("Username and password are required.");
                return;
              }

              setLoading(true);
              try {
                await new Promise((r) => setTimeout(r, 280));
                localStorage.setItem("teacher_dashboard_logged_in", "true");
                localStorage.setItem(
                  "teacher_dashboard_token",
                  "static-demo-token"
                );
                router.push("/home");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong.");
              } finally {
                setLoading(false);
              }
            }}
            className="space-y-3"
          >
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="h-[40px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2f76b7]"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="h-[40px] w-full rounded-md border border-[#9bb0cc] bg-[#f8fafc] px-3 text-[13px] outline-none focus:border-[#2f76b7]"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-[40px] w-full rounded-md bg-[#3f79b5] text-[14px] font-semibold text-white hover:bg-[#356e9f] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>
        </div>
      </main>
      <TeacherFooter />
    </div>
  );
}
