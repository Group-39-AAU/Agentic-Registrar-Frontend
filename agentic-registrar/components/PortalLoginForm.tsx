"use client";

import {
  ApiError,
  changePassword,
  loginUser,
  setStudentAccessToken,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Stage = "login" | "change-password";

/**
 * Portal login. Two-stage flow:
 *   1. "login" — UGR ID + (temp PIN or password). If the backend says
 *      `must_change_password: true`, we DO NOT store the token or
 *      redirect; we switch to the change-password stage instead.
 *   2. "change-password" — uses the just-issued token (held in memory
 *      only) to call POST /auth/change-password. On success we discard
 *      that token and bounce the user back to the login screen so they
 *      sign in fresh with their new password.
 */
export default function PortalLoginForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Held only while we're in the change-password step — never written
  // to localStorage because the backend lockout blocks every other
  // endpoint until the password actually changes.
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Format: letters/digits/digits. We only check the shape — prefix length,
  // middle-segment length, and year suffix length are all variable — and we
  // leave canonicalisation (case-folding the prefix to UPPERCASE) to the
  // backend, which compares student IDs case-insensitively.
  const idPattern = /^[A-Za-z]+\/\d+\/\d+$/;

  function resetToLogin(notice?: string) {
    setStage("login");
    setPendingToken(null);
    setTempPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassword("");
    setError(null);
    if (notice) setSuccessNotice(notice);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!idPattern.test(username.trim())) {
      setError("ID must look like letters/digits/digits (e.g. UGR/6550/19).");
      return;
    }
    if (password.trim().length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setBusy(true);
    try {
      // Backend stores student IDs upper-case (e.g. UGR/6550/19); send
      // the upper-cased form so a user typing "ugr/6550/19" still matches.
      const response = await loginUser({
        username: username.trim().toUpperCase(),
        password,
      });
      if (response.must_change_password) {
        // Don't persist the token — backend will reject any other call
        // until the password is changed. Hold it in memory and switch
        // to the password-change screen.
        setPendingToken(response.access_token);
        setTempPassword(password);
        setStage("change-password");
      } else {
        setStudentAccessToken(response.access_token);
        window.dispatchEvent(new Event("aau-auth-changed"));
        router.push("/portal/home");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "Invalid username or password.");
      } else if (err instanceof TypeError) {
        setError("Cannot reach the server. Check your connection or try again later.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pendingToken) {
      // Defensive — shouldn't happen because the UI only renders this
      // form after a successful first-login that issued the token.
      resetToLogin("Please sign in again.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (newPassword === tempPassword) {
      setError("New password must be different from your temporary one.");
      return;
    }

    setBusy(true);
    try {
      await changePassword(pendingToken, tempPassword, newPassword);
      resetToLogin("Password changed. Please log in with your new password.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || `Could not change password (HTTP ${err.status}).`);
      } else if (err instanceof TypeError) {
        setError("Cannot reach the server. Check your connection or try again later.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Change-password stage ────────────────────────────────────
  if (stage === "change-password") {
    return (
      <div className="px-10 pb-6 pt-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(31,91,148,0.32)] border border-black/[0.06] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)]">
        <div className="text-[18px] font-semibold tracking-wide text-[#2a66a7]">Set a new password</div>
        <p className="mt-1 text-[12px] text-[#5a5a5a]">
          You signed in with a temporary PIN. Choose a permanent password to continue.
        </p>

        <form className="mt-4 flex flex-col gap-4" onSubmit={handleChangePassword}>
          {error ? (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </p>
          ) : null}

          <label className="text-[12px] font-semibold text-[#3a3a3a]">
            New password
            <input
              name="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              autoFocus
              className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 px-3 text-[13px] text-[#2a2a2a] outline-none transition-all duration-150 hover:border-[#7a98bf] focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
            />
          </label>

          <label className="text-[12px] font-semibold text-[#3a3a3a]">
            Confirm new password
            <input
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat the new password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[linear-gradient(180deg,#f3f7ff_0%,#eef4ff_100%)] py-2.5 px-3 text-[13px] text-[#2a2a2a] outline-none transition-all duration-150 hover:border-[#7a98bf] focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="h-[42px] rounded-md bg-[linear-gradient(180deg,#4a8ac3_0%,#3f79b5_55%,#356e9f_100%)] text-[15px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_22px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#3f79b5_0%,#356e9f_100%)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {busy ? "Updating…" : "Set new password"}
          </button>

          <button
            type="button"
            onClick={() => resetToLogin()}
            className="text-[12px] text-[#5a5a5a] hover:underline"
          >
            Cancel and return to login
          </button>
        </form>
      </div>
    );
  }

  // ── Login stage ──────────────────────────────────────────────
  return (
    <div className="px-10 pb-6 pt-8 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_24px_48px_-24px_rgba(31,91,148,0.32)] border border-black/[0.06] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)]">
      <div className="text-[18px] font-semibold tracking-wide text-[#2a66a7]">Login to your account</div>

      <form
        className="mt-4 flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        {successNotice ? (
          <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-700">
            {successNotice}
          </p>
        ) : null}
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
          disabled={busy}
          className="h-[42px] rounded-md bg-[linear-gradient(180deg,#4a8ac3_0%,#3f79b5_55%,#356e9f_100%)] text-[18px] font-semibold tracking-wide text-white shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_10px_22px_-10px_rgba(31,91,148,0.7)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,#3f79b5_0%,#356e9f_100%)] hover:shadow-[0_2px_0_rgba(255,255,255,0.24)_inset,0_16px_28px_-12px_rgba(31,91,148,0.85)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {busy ? "Signing in…" : "Login"}
        </button>

        <Link
          href="/forgot-password"
          className="text-[18px] text-[#808080] hover:underline"
        >
          Forgot Password?
        </Link>
      </form>
    </div>
  );
}
