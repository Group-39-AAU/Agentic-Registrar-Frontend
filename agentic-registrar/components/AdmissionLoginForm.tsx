"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ApiError, loginUser, setAccessToken } from "@/lib/api";
import { truncatePasswordTo72Bytes } from "@/lib/password";

function InputWithIcon({
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
  name,
  autoComplete,
}: {
  icon: React.ReactNode;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  autoComplete?: string;
}) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        {icon}
      </div>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 pl-10 pr-3 text-[12px] text-[#2a2a2a] outline-none transition-all duration-150 hover:border-[#7a98bf] focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
      />
    </div>
  );
}

/** Backend login (form-urlencoded) for admissions portal — stores access token. */
export default function AdmissionLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginUser({
        username: username.trim(),
        password: truncatePasswordTo72Bytes(password),
      });
      setAccessToken(data.access_token);
      window.dispatchEvent(new Event("aau-auth-changed"));
      setPassword("");
      // Full navigation replaces the login entry in session history (Back won’t return here)
      window.location.replace("/admissions/after-login");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Login failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] px-8 py-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(31,91,148,0.32)]">
      <div className="text-[18px] font-semibold text-[#2a66a7]">
        Applicant login
      </div>
      <p className="mt-1 text-[12px] text-[#5a5a5a]">
        Sign in with your registered email and password to apply or view your
        applications.
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800"
        >
          {error}
        </div>
      ) : null}

      <form className="mt-6 flex flex-col gap-5" onSubmit={handleSubmit}>
        <InputWithIcon
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username or email"
          autoComplete="username"
          icon={
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
          }
        />
        <InputWithIcon
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          icon={
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
          }
        />
        <button
          type="submit"
          disabled={loading}
          className="h-[44px] rounded-md bg-[linear-gradient(180deg,#4a8ac3_0%,#3f79b5_55%,#356e9f_100%)] text-[16px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_22px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 enabled:hover:-translate-y-[1px] enabled:hover:bg-[linear-gradient(180deg,#3f79b5_0%,#356e9f_100%)] enabled:hover:shadow-[0_2px_0_rgba(255,255,255,0.24)_inset,0_16px_28px_-12px_rgba(31,91,148,0.85)] disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-[12px] text-[#5a5a5a]">
        New applicant?{" "}
        <Link href="/admissions/register" className="font-semibold text-[#2f76b7] underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
