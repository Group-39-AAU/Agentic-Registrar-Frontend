"use client";

import { ApiError, loginUser, setStudentAccessToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Visual-only login card for the main portal home (no API calls).
 */
export default function PortalLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const idPattern = /^[A-Za-z]{3}\/\d{4}\/\d{2}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!idPattern.test(username.trim())) {
      setError("ID format must be like UGR/****/**.");
      return;
    }
    if (password.trim().length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    try {
      const response = await loginUser({ username, password });
      setStudentAccessToken(response.access_token);
      window.dispatchEvent(new Event("aau-auth-changed"));
      router.push("/portal/home");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid username or password.");
      } else if (err instanceof TypeError) {
        setError("Cannot reach the server. Check your connection or try again later.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    }
  };
  return (
    <div className="px-10 pb-6 pt-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(31,91,148,0.32)] border border-black/[0.06] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)]">
      <div className="text-[18px] font-semibold tracking-wide text-[#2a66a7]">Login to your account</div>

      <form
        className="mt-4 flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        {error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </p>
        ) : null}
        <div className="relative w-full">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-[#6b6b6b]"
            >
              <path
                d="M20 21a8 8 0 0 0-16 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="12"
                cy="8"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <input
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="UGR/1504/14"
            autoComplete="username"
            className="w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 pl-10 pr-3 text-[12px] text-[#2a2a2a] outline-none transition-all duration-150 hover:border-[#7a98bf] focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
          />
        </div>
        <div className="relative w-full">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-4 w-4 text-[#6b6b6b]"
            >
              <path
                d="M7 11V8a5 5 0 0 1 10 0v3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="6"
                y="11"
                width="12"
                height="10"
                rx="2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 pl-10 pr-3 text-[12px] text-[#2a2a2a] outline-none transition-all duration-150 hover:border-[#7a98bf] focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
          />
        </div>
        <button
          type="submit"
          className="h-[42px] rounded-md bg-[linear-gradient(180deg,#4a8ac3_0%,#3f79b5_55%,#356e9f_100%)] text-[18px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_22px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#3f79b5_0%,#356e9f_100%)] hover:shadow-[0_2px_0_rgba(255,255,255,0.24)_inset,0_16px_28px_-12px_rgba(31,91,148,0.85)]"
        >
          Login
        </button>

        <a
          href="#"
          className="text-[18px] text-[#808080] hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Forgot Password?
        </a>
      </form>
    </div>
  );
}
