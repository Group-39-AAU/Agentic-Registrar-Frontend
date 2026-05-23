"use client";

import Header from "../components/header";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError, resetPassword } from "@/lib/api";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing its token. Request a new one from the login page.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        // Backend returns a generic "Invalid or expired reset link." for
        // any token problem, which is what we want to show the user.
        setError(err.message || "Invalid or expired reset link.");
      } else if (err instanceof TypeError) {
        setError("Could not reach the server. Try again in a moment.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full border border-black/[0.06] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] px-10 pb-7 pt-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(31,91,148,0.32)]">
      <h1 className="text-[20px] font-semibold tracking-wide text-[#2a66a7]">
        Reset password
      </h1>
      <p className="mt-1 text-[13px] text-[#5a5a5a]">
        Choose a new password for your account.
      </p>

      {done ? (
        <div className="mt-5 space-y-4">
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-3 text-[13px] text-green-800">
            Password reset. You can now log in with your new password.
          </p>
          <Link
            href="/"
            className="inline-block rounded-md bg-[#3f79b5] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#356e9f]"
          >
            Go to login
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
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
              className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
            />
          </label>
          <label className="text-[12px] font-semibold text-[#3a3a3a]">
            Confirm new password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat the new password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="h-[42px] rounded-md bg-[linear-gradient(180deg,#4a8ac3_0%,#3f79b5_55%,#356e9f_100%)] text-[15px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_22px_-10px_rgba(31,91,148,0.7)] transition-all hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Updating…" : "Reset password"}
          </button>
          <Link
            href="/forgot-password"
            className="text-[12px] text-[#5a5a5a] hover:underline"
          >
            Need a new reset link?
          </Link>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f2f4f6] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Header />
      <main className="mx-auto flex w-full max-w-[460px] flex-1 items-center px-5 py-12">
        <Suspense
          fallback={
            <div className="w-full border border-black/[0.06] bg-white px-10 py-12 text-center text-[13px] text-[#5a5a5a]">
              Loading…
            </div>
          }
        >
          <ResetPasswordInner />
        </Suspense>
      </main>
    </div>
  );
}
