"use client";

import Header from "../components/header";
import Link from "next/link";
import { useState } from "react";
import { ApiError, requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Enter your account email.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      // Backend masks "no such email" as 204, so a real error here
      // is a server/network problem — but we still keep the same
      // success-style message to avoid hinting either way.
      if (err instanceof ApiError && err.status >= 500) {
        setError("Could not reach the server. Try again in a moment.");
      } else if (err instanceof TypeError) {
        setError("Could not reach the server. Try again in a moment.");
      } else {
        // For 4xx (validation), reveal the message.
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f4f6] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Header />
      <main className="mx-auto flex w-full max-w-[460px] flex-1 items-center px-5 py-12">
        <div className="w-full border border-black/[0.06] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] px-10 pb-7 pt-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(31,91,148,0.32)]">
          <h1 className="text-[20px] font-semibold tracking-wide text-[#2a66a7]">
            Forgot password
          </h1>
          <p className="mt-1 text-[13px] text-[#5a5a5a]">
            Enter the email on your account and we&apos;ll send you a reset link.
          </p>

          {sent ? (
            <div className="mt-5 space-y-4">
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-3 text-[13px] text-green-800">
                If an account exists for <span className="font-semibold">{email}</span>,
                a reset link is on its way. The link expires in 30 minutes.
              </p>
              <Link
                href="/"
                className="inline-block text-[13px] font-semibold text-[#2f76b7] hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
              {error ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                  {error}
                </p>
              ) : null}
              <label className="text-[12px] font-semibold text-[#3a3a3a]">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="h-[42px] rounded-md bg-[linear-gradient(180deg,#4a8ac3_0%,#3f79b5_55%,#356e9f_100%)] text-[15px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_22px_-10px_rgba(31,91,148,0.7)] transition-all hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
              <Link
                href="/"
                className="text-[12px] text-[#5a5a5a] hover:underline"
              >
                ← Back to login
              </Link>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
