"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/app/components/ui/icons";
import { cn } from "@/lib/utils";

type ModalVariant = "solid" | "glass";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /**
   * `solid` — neutral card for dashboards and tools (default).
   * `glass` — marketing / auth shell only; do not use for dashboard modals.
   */
  variant?: ModalVariant;
};

function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close modal"
      onClick={onClose}
      className="absolute right-3.5 top-3.5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/95 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <CloseIcon className="h-4 w-4" />
    </button>
  );
}

/** Dashboard modals: scroll inside the panel when content is tall. */
const innerPanelSolid =
  "relative inline-flex min-h-0 min-w-0 max-w-full flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl";

/** Auth / glass: no inner scroll — size the shell to the viewport instead. */
const innerPanelGlass =
  "relative inline-flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-2xl";

/** Tall solid modals scroll inside the panel. */
const innerMaxHeightSolid = "max-h-[min(90dvh,calc(100vh-2rem))]";

/** Glass auth uses almost the full viewport height (no inner scrollbar). */
const innerMaxHeightGlass = "max-h-[min(96dvh,calc(100dvh-0.35rem))]";

/** When callers omit max-w-*, keep a readable default and never exceed the screen. */
const defaultMaxWidth = "max-w-[min(56rem,calc(100vw-1.5rem))]";

export function Modal({ open, onClose, children, className, variant = "solid" }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-3 py-6 backdrop-blur-[2px] sm:px-5",
        variant === "glass"
          ? "overflow-hidden overscroll-none"
          : "overflow-y-auto overscroll-contain"
      )}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal overlay"
        onClick={onClose}
      />

      {/* Shrink-wrap to child width/height (className usually supplies max-w-*) */}
      <div
        className={cn(
          "relative z-10 mx-auto w-fit max-w-full min-w-0",
          variant === "solid" && "px-0.5 sm:px-1"
        )}
      >
        {variant === "glass" ? (
          <div className="relative inline-block w-fit max-w-full min-w-0 rounded-[2.25rem] border border-white/50 bg-white/13 p-2.5 align-top shadow-[0_36px_80px_-28px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-[18px] sm:rounded-[2.5rem] sm:p-3 dark:border-white/12 dark:bg-slate-950/22 dark:shadow-[0_32px_70px_-28px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div
              className="pointer-events-none absolute left-2 top-2 h-10 w-10 rounded-full border border-white/40 bg-white/25 shadow-sm dark:border-white/15 dark:bg-white/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-2 right-2 h-10 w-10 rounded-full border border-white/40 bg-white/25 shadow-sm dark:border-white/15 dark:bg-white/10"
              aria-hidden
            />

            <div
              className={cn(
                innerPanelGlass,
                "rounded-[1.35rem] border border-transparent bg-transparent shadow-none sm:rounded-[1.65rem] dark:bg-transparent",
                defaultMaxWidth,
                innerMaxHeightGlass,
                className
              )}
            >
              <ModalCloseButton onClose={onClose} />
              {children}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              innerPanelSolid,
              "border border-slate-200 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.45)]",
              defaultMaxWidth,
              innerMaxHeightSolid,
              className
            )}
          >
            <ModalCloseButton onClose={onClose} />
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
