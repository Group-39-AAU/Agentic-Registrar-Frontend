"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminFooter from "@/components/AdminFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function truncatePasswordTo72Bytes(password: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(password);
  if (bytes.length <= 72) return password;
  let len = 72;
  while (len > 0 && (bytes[len - 1] & 0xc0) === 0x80) len--;
  return new TextDecoder().decode(bytes.slice(0, len));
}

function LoginTopBrand() {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1180px] items-center px-5">
        <Image src="/assets/logo.png" alt="AAU" width={44} height={44} className="h-11 w-11" />
        <div className="ml-3 mr-3 h-[44px] w-[2px] bg-[#1f6fb3]" />
        <div className="leading-none">
          <div className="mb-1 text-[15px] tracking-wide text-[#1f6fb3]">አዲስ አበባ ዩኒቨርሲቲ</div>
          <div className="text-[12px] font-bold tracking-wide text-[#e04b4b]">
            ADDIS ABABA UNIVERSITY
          </div>
        </div>
      </div>
    </header>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <LoginTopBrand />
      <main className="mx-auto flex w-full max-w-[460px] flex-1 items-center px-5 py-8">
        <div className="aau-card w-full rounded-2xl p-7">
          <div className="mb-5 text-center">
            <Image src="/assets/logo.png" alt="AAU" width={56} height={56} className="mx-auto h-14 w-14 drop-shadow-[0_4px_10px_rgba(31,91,148,0.25)]" />
            <h1 className="mt-3 text-[24px] font-bold tracking-[-0.01em] text-[#2a66a7]">Admin Login</h1>
            <p className="text-[13px] text-[#5a5a5a]">
              Sign in to access the operations dashboard.
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
                const params = new URLSearchParams();
                params.set("username", username.trim());
                params.set("password", truncatePasswordTo72Bytes(password));

                const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: params.toString(),
                });
                const data = (await res.json().catch(() => ({}))) as {
                  access_token?: string;
                  detail?: string;
                  message?: string;
                };

                if (!res.ok || !data.access_token) {
                  throw new Error(
                    data.detail || data.message || "Login failed. Check credentials and try again."
                  );
                }

                localStorage.setItem("admin_dashboard_logged_in", "true");
                localStorage.setItem("admin_dashboard_token", data.access_token);
                router.push("/applications");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Login failed.");
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
              className="h-[42px] w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="h-[42px] w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="aau-button-primary h-[42px] w-full rounded-md text-[14px] font-semibold tracking-wide text-white"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
}
