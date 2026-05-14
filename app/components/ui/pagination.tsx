"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const startItem = totalItems != null && pageSize != null ? (page - 1) * pageSize + 1 : null;
  const endItem =
    totalItems != null && pageSize != null ? Math.min(page * pageSize, totalItems) : null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Item count */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {startItem != null && endItem != null && totalItems != null ? (
          <>
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{startItem}–{endItem}</span>{" "}
            of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalItems}</span> results
          </>
        ) : (
          <>
            Page <span className="font-semibold text-slate-700 dark:text-slate-300">{page}</span>{" "}
            of <span className="font-semibold text-slate-700 dark:text-slate-300">{totalPages}</span>
          </>
        )}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          aria-label="Previous page"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition",
            hasPrev
              ? "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:bg-sky-50 hover:text-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
              : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`ellipsis-${i}`}
                className="inline-flex h-8 w-8 items-center justify-center text-slate-400 dark:text-slate-500"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition",
                  p === page
                    ? "border-brand-primary bg-brand-primary text-white shadow-sm shadow-brand-primary/25"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:bg-sky-50 hover:text-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          aria-label="Next page"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition",
            hasNext
              ? "border-slate-200 bg-white text-slate-600 hover:border-brand-primary hover:bg-sky-50 hover:text-brand-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
              : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
