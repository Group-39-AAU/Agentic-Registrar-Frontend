"use client";

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

  return (
    <div className="px-10 pb-6 pt-8 shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-black/10">
      <div className="text-[18px] text-[#2a66a7]">Login to your account</div>

      <form
        className="mt-4 flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);

          if (!idPattern.test(username.trim())) {
            setError("ID format must be like UGR/1504/14.");
            return;
          }
          if (password.trim().length < 4) {
            setError("Password must be at least 4 characters.");
            return;
          }

          router.push("/portal/home");
        }}
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
            className="w-full rounded-md border border-[#9bb0cc] bg-[#eef4ff] py-2 pl-10 pr-3 text-[12px] text-[#2a2a2a] outline-none focus:border-[#2f76b7] focus:ring-1 focus:ring-[#2f76b7]/40"
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
            className="w-full rounded-md border border-[#9bb0cc] bg-[#eef4ff] py-2 pl-10 pr-3 text-[12px] text-[#2a2a2a] outline-none focus:border-[#2f76b7] focus:ring-1 focus:ring-[#2f76b7]/40"
          />
        </div>
        <button
          type="submit"
          className="h-[40px] rounded bg-[#3f79b5] text-[18px] text-white hover:bg-[#356e9f]"
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
