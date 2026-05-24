"use client";

/**
 * Reusable pagination control used on every listing page in the
 * admin dashboard. Renders a row of "<< < Page X of Y > >>" buttons
 * plus an optional page-size selector.
 *
 * Modes
 * -----
 * 1. Backend-paginated with a known ``total``:
 *      <Pagination page={1} pageSize={20} total={134} onPageChange={…} />
 *    Renders the full first/prev/next/last quartet with a precise
 *    "Page X of Y" label and "showing M of N" count.
 *
 * 2. Backend-paginated without a known ``total`` (e.g. the
 *    flagged-queue endpoint that returns just ``list[…]``):
 *      <Pagination
 *        page={1}
 *        pageSize={20}
 *        hasMore={items.length === pageSize}
 *        onPageChange={…}
 *      />
 *    Renders only prev/next; the "next" button is disabled when the
 *    current page returned fewer items than the page size.
 *
 * Both modes accept an optional ``pageSizeOptions`` list to show a
 * compact <select> for the size. Pass ``onPageSizeChange`` to enable
 * it; omit to hide the control entirely.
 */

import type { ReactNode } from "react";

type Props = {
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  /** Optional label like "applications" or "results" for the count text. */
  itemLabel?: string;
  className?: string;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function Btn({
  children,
  disabled,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="grid h-[30px] w-[34px] place-items-center rounded-md border border-[#cdd6e1] bg-white text-[13px] font-semibold text-[#2f76b7] transition-colors enabled:hover:border-[#2f76b7] enabled:hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-[#f8fafc] disabled:text-[#b8c2cf]"
    >
      {children}
    </button>
  );
}

export default function Pagination({
  page,
  pageSize,
  total,
  hasMore,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  itemLabel = "results",
  className = "",
}: Props) {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safePageSize = Math.max(1, Math.floor(pageSize) || 1);

  const totalKnown = typeof total === "number" && total >= 0;
  const totalPages = totalKnown
    ? Math.max(1, Math.ceil(total / safePageSize))
    : null;

  const onFirstPage = safePage <= 1;
  const onLastPage = totalKnown
    ? safePage >= (totalPages as number)
    : !hasMore;

  const showingFrom = totalKnown && total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const showingTo = totalKnown
    ? Math.min(safePage * safePageSize, total as number)
    : safePage * safePageSize;

  const sizeOptions = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const showSizeControl = typeof onPageSizeChange === "function";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-[#fafbfc] px-3 py-2 text-[12px] text-[#5a5a5a] ${className}`}
    >
      <div>
        {totalKnown ? (
          <>
            Showing{" "}
            <span className="font-semibold text-[#1f2f40]">
              {total === 0 ? 0 : `${showingFrom}–${showingTo}`}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[#1f2f40]">{total}</span> {itemLabel}
          </>
        ) : (
          <>
            Page <span className="font-semibold text-[#1f2f40]">{safePage}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showSizeControl ? (
          <div className="mr-2 flex items-center gap-1.5">
            <label
              htmlFor="pagination-page-size"
              className="text-[12px] text-[#5a5a5a]"
            >
              Per page
            </label>
            <select
              id="pagination-page-size"
              value={safePageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value) || safePageSize)}
              className="h-[28px] rounded-md border border-[#cdd6e1] bg-white px-2 text-[12px] outline-none focus:border-[#2f76b7]"
            >
              {sizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <Btn
          ariaLabel="First page"
          disabled={onFirstPage}
          onClick={() => onPageChange(1)}
        >
          &laquo;
        </Btn>
        <Btn
          ariaLabel="Previous page"
          disabled={onFirstPage}
          onClick={() => onPageChange(safePage - 1)}
        >
          &lsaquo;
        </Btn>

        <div className="px-2 text-[12.5px] font-semibold text-[#1f2f40]">
          {totalKnown ? (
            <>
              Page {safePage} of {totalPages}
            </>
          ) : (
            <>Page {safePage}</>
          )}
        </div>

        <Btn
          ariaLabel="Next page"
          disabled={onLastPage}
          onClick={() => onPageChange(safePage + 1)}
        >
          &rsaquo;
        </Btn>
        <Btn
          ariaLabel="Last page"
          disabled={onLastPage || !totalKnown}
          onClick={() => totalKnown && onPageChange(totalPages as number)}
        >
          &raquo;
        </Btn>
      </div>
    </div>
  );
}
