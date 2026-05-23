"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import {
  ApiError,
  changePassword,
  clearStoredStudentAccessToken,
  getStoredStudentAccessToken,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const token = getStoredStudentAccessToken();
    if (!token) {
      setError("You are not signed in. Please log in again.");
      router.replace("/");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current one.");
      return;
    }

    setBusy(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setDone(true);
      // Force re-login with the new password — same UX as the
      // first-login change flow in PortalLoginForm.
      window.setTimeout(() => {
        clearStoredStudentAccessToken();
        window.dispatchEvent(new Event("aau-auth-changed"));
        router.replace("/");
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err instanceof ApiError) {
        setError(err.message || `Could not change password (HTTP ${err.status}).`);
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
    <div className="flex min-h-screen flex-col bg-[#f2f4f6] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />
      <main className="flex-1 py-[8px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />
          <section className="flex-1 px-3 md:ml-6 md:px-0">
            <div className="rounded-sm border border-[#c7d4df] bg-white pb-[60px] md:max-w-[995px]">
              <div className="rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#458dcc] px-4 py-2 text-[14px] text-white">
                Change Password
              </div>
              <div className="px-4 py-6 md:px-10 md:py-10">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2f78b7]">
                  Account security
                </p>
                <h1 className="mt-1 text-[22px] font-bold text-[#163b63]">Change your password</h1>
                <p className="mt-2 max-w-[520px] text-[13px] text-[#5a5a5a]">
                  Pick a new password (at least 8 characters). You&apos;ll be signed out and asked
                  to log in again with the new password.
                </p>

                {done ? (
                  <p className="mt-6 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-[13px] text-green-800">
                    Password changed. Redirecting you to the login screen…
                  </p>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-6 max-w-[460px] space-y-4">
                    {error ? (
                      <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                        {error}
                      </p>
                    ) : null}

                    <label className="block text-[12px] font-semibold text-[#3a3a3a]">
                      Current password
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[#fafcff] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
                      />
                    </label>

                    <label className="block text-[12px] font-semibold text-[#3a3a3a]">
                      New password
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[#fafcff] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
                      />
                    </label>

                    <label className="block text-[12px] font-semibold text-[#3a3a3a]">
                      Confirm new password
                      <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[#fafcff] px-3 py-2.5 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white focus:ring-2 focus:ring-[#2f76b7]/25"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={busy}
                      className="h-[42px] rounded-md bg-[#3f79b5] px-6 text-[14px] font-semibold text-white hover:bg-[#356e9f] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Updating…" : "Change password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      <PortalFooter />
    </div>
  );
}
