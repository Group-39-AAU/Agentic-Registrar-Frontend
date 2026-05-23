"use client";

import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import { useState } from "react";

/**
 * Reusable placeholder page for portal nav links that don't yet have a
 * real implementation. Renders the standard portal chrome and a
 * believable static UI based on the variant — forms collect input but
 * never call the backend; info variants show data-shaped cards/tables.
 *
 * Used by ~30 stub routes under app/portal/<slug>/page.tsx so each
 * named link in the side menu and top nav lands on its own page.
 */

export type StubField = {
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "number" | "file" | "email";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export type StubCard = { title: string; body: string };
export type StubRow = { label: string; value: string };

export type StubPageProps = {
  title: string;
  subtitle?: string;
  variant: "form" | "info" | "request" | "fees" | "checklist" | "upload";
  fields?: StubField[];
  cards?: StubCard[];
  rows?: StubRow[];
  /** Column headers for `fees` / `checklist` table variants. */
  columns?: string[];
  /** Each table row: cells aligned to `columns`. */
  table?: string[][];
  ctaLabel?: string;
  /** Optional intro paragraph above the body. */
  intro?: string;
};

export default function StubPage({
  title,
  subtitle,
  variant,
  fields = [],
  cards = [],
  rows = [],
  columns,
  table,
  ctaLabel,
  intro,
}: StubPageProps) {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3500);
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
                {title}
              </div>
              <div className="px-4 py-6 md:px-10 md:py-10">
                <h1 className="text-[22px] font-bold text-[#163b63]">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-[13px] text-[#5a5a5a]">{subtitle}</p>
                ) : null}
                {intro ? (
                  <p className="mt-3 max-w-[680px] text-[13px] text-[#3a3a3a]">{intro}</p>
                ) : null}

                {submitted ? (
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                    Submission captured (demo placeholder — this page isn&apos;t wired to a
                    backend yet).
                  </p>
                ) : null}

                {/* ── Variant: form / request / upload ── */}
                {(variant === "form" || variant === "request" || variant === "upload") && (
                  <form
                    onSubmit={onSubmit}
                    className="mt-6 grid max-w-[680px] grid-cols-1 gap-4 md:grid-cols-2"
                  >
                    {fields.map((f) => (
                      <label
                        key={f.label}
                        className={`block text-[12px] font-semibold text-[#3a3a3a] ${
                          f.type === "textarea" ? "md:col-span-2" : ""
                        }`}
                      >
                        {f.label}
                        {f.required ? <span className="text-[#a31a1a]"> *</span> : null}
                        {f.type === "textarea" ? (
                          <textarea
                            rows={4}
                            placeholder={f.placeholder}
                            required={f.required}
                            className="mt-1 w-full rounded-md border border-[#9bb0cc] bg-[#fafcff] px-3 py-2 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white"
                          />
                        ) : f.type === "select" ? (
                          <select
                            required={f.required}
                            defaultValue=""
                            className="mt-1 h-[40px] w-full rounded-md border border-[#9bb0cc] bg-[#fafcff] px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white"
                          >
                            <option value="" disabled>
                              {f.placeholder ?? "Select an option"}
                            </option>
                            {(f.options ?? []).map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "file" ? (
                          <input
                            type="file"
                            required={f.required}
                            className="mt-1 block w-full text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-[#3f79b5] file:px-3 file:py-1.5 file:text-white file:hover:bg-[#356e9f]"
                          />
                        ) : (
                          <input
                            type={f.type ?? "text"}
                            placeholder={f.placeholder}
                            required={f.required}
                            className="mt-1 h-[40px] w-full rounded-md border border-[#9bb0cc] bg-[#fafcff] px-3 text-[13px] outline-none focus:border-[#2f76b7] focus:bg-white"
                          />
                        )}
                      </label>
                    ))}
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="h-[40px] rounded-md bg-[#3f79b5] px-5 text-[13px] font-semibold text-white hover:bg-[#356e9f]"
                      >
                        {ctaLabel ?? (variant === "upload" ? "Upload" : "Submit")}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Variant: info (cards) ── */}
                {variant === "info" && (
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {cards.map((c) => (
                      <div
                        key={c.title}
                        className="rounded-md border border-[#dde6ef] bg-[#fbfdff] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                      >
                        <h3 className="text-[13px] font-bold uppercase tracking-wide text-[#1f5b94]">
                          {c.title}
                        </h3>
                        <p className="mt-1.5 text-[13px] text-[#3a3a3a]">{c.body}</p>
                      </div>
                    ))}
                    {rows.length > 0 && (
                      <div className="rounded-md border border-[#dde6ef] bg-white p-4 md:col-span-2">
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-2">
                          {rows.map((r) => (
                            <div key={r.label} className="flex items-baseline justify-between border-b border-dashed border-gray-100 py-1.5">
                              <dt className="text-[12px] font-semibold text-[#5a5a5a]">{r.label}</dt>
                              <dd className="text-[12.5px] text-[#1f2f40]">{r.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                    {ctaLabel ? (
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => setSubmitted(true)}
                          className="h-[40px] rounded-md bg-[#3f79b5] px-5 text-[13px] font-semibold text-white hover:bg-[#356e9f]"
                        >
                          {ctaLabel}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* ── Variant: fees / checklist (table) ── */}
                {(variant === "fees" || variant === "checklist") && (
                  <div className="mt-6 overflow-x-auto rounded-md border border-[#dde6ef]">
                    <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[#dde6ef] bg-[#f5f9fc] text-[11px] font-semibold uppercase tracking-wide text-[#5a5a5a]">
                          {(columns ?? []).map((c) => (
                            <th key={c} className="px-4 py-3">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(table ?? []).map((r, i) => (
                          <tr key={i} className="border-b border-gray-100">
                            {r.map((cell, j) => (
                              <td key={j} className="px-4 py-3 text-[#1f2f40]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
