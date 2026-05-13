"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "danger" | "warning" | "info";

export type ToastAction = {
  label: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
};

export type ToastMessage = {
  id: number;
  variant: ToastVariant;
  message: string;
  /** Optional buttons (e.g. confirm / cancel). When present, prefer not auto-dismissing from the caller. */
  actions?: ToastAction[];
};

type ToastCenterProps = {
  toasts: ToastMessage[];
};

/** Panel surface + text; stripe + icon chip carry the hue. */
const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-emerald-300/90 bg-white text-emerald-950 shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_-2px_8px_0_rgba(16,185,129,0.08)_inset,0_22px_44px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.06),0_0_40px_-8px_rgba(16,185,129,0.35)] dark:border-emerald-500/35 dark:bg-slate-900 dark:text-emerald-50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_-2px_12px_0_rgba(16,185,129,0.12)_inset,0_28px_56px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_-6px_rgba(52,211,153,0.25)]",
  danger:
    "border-rose-300/90 bg-white text-rose-950 shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_-2px_8px_0_rgba(244,63,94,0.08)_inset,0_22px_44px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.06),0_0_40px_-8px_rgba(244,63,94,0.3)] dark:border-rose-500/35 dark:bg-slate-900 dark:text-rose-50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_-2px_12px_0_rgba(244,63,94,0.12)_inset,0_28px_56px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_-6px_rgba(251,113,133,0.22)]",
  warning:
    "border-amber-300/90 bg-white text-amber-950 shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_-2px_8px_0_rgba(245,158,11,0.1)_inset,0_22px_44px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.06),0_0_40px_-8px_rgba(245,158,11,0.38)] dark:border-amber-500/40 dark:bg-slate-900 dark:text-amber-50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_-2px_12px_0_rgba(245,158,11,0.14)_inset,0_28px_56px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_-6px_rgba(251,191,36,0.28)]",
  info:
    "border-sky-300/90 bg-white text-sky-950 shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_-2px_8px_0_rgba(14,165,233,0.08)_inset,0_22px_44px_-12px_rgba(15,23,42,0.2),0_0_0_1px_rgba(15,23,42,0.06),0_0_40px_-8px_rgba(14,165,233,0.32)] dark:border-sky-500/35 dark:bg-slate-900 dark:text-sky-50 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.12)_inset,0_-2px_12px_0_rgba(14,165,233,0.12)_inset,0_28px_56px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_-6px_rgba(56,189,248,0.22)]",
};

const variantStripe: Record<ToastVariant, string> = {
  success:
    "bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] dark:from-emerald-300 dark:to-emerald-500",
  danger:
    "bg-gradient-to-b from-rose-400 to-rose-600 shadow-[0_0_16px_rgba(244,63,94,0.45),inset_0_1px_0_rgba(255,255,255,0.45)] dark:from-rose-300 dark:to-rose-500",
  warning:
    "bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_0_18px_rgba(245,158,11,0.55),inset_0_1px_0_rgba(255,255,255,0.5)] dark:from-amber-300 dark:to-amber-500",
  info:
    "bg-gradient-to-b from-sky-400 to-sky-600 shadow-[0_0_16px_rgba(14,165,233,0.45),inset_0_1px_0_rgba(255,255,255,0.45)] dark:from-sky-300 dark:to-sky-500",
};

const variantIconChip: Record<ToastVariant, string> = {
  success:
    "bg-emerald-100 text-emerald-700 shadow-[0_2px_0_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-2px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/30 dark:bg-emerald-950/80 dark:text-emerald-300 dark:ring-emerald-400/25",
  danger:
    "bg-rose-100 text-rose-700 shadow-[0_2px_0_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-2px_rgba(244,63,94,0.35)] ring-1 ring-rose-400/30 dark:bg-rose-950/80 dark:text-rose-300 dark:ring-rose-400/25",
  warning:
    "bg-amber-100 text-amber-800 shadow-[0_2px_0_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-2px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/35 dark:bg-amber-950/80 dark:text-amber-200 dark:ring-amber-400/25",
  info:
    "bg-sky-100 text-sky-700 shadow-[0_2px_0_0_rgba(255,255,255,0.9)_inset,0_4px_12px_-2px_rgba(14,165,233,0.35)] ring-1 ring-sky-400/30 dark:bg-sky-950/80 dark:text-sky-300 dark:ring-sky-400/25",
};

const variantIcons = {
  success: CheckCircle2,
  danger: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

export function ToastCenter({ toasts }: ToastCenterProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-200 flex items-center justify-center px-4">
      {/* Soft vignette so the toast reads as the focal point, not part of the page chrome */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_58%_at_50%_42%,transparent_0%,rgba(15,23,42,0.14)_52%,rgba(15,23,42,0.32)_100%)] dark:bg-[radial-gradient(ellipse_72%_58%_at_50%_42%,transparent_0%,rgba(0,0,0,0.35)_48%,rgba(0,0,0,0.62)_100%)]"
        aria-hidden
      />
      <div className="relative flex w-full max-w-md flex-col items-center gap-3">
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant];
          const actions = toast.actions ?? [];

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto relative w-full overflow-hidden rounded-2xl border-2 px-4 py-3.5 text-sm",
                "animate-[toast-in_420ms_cubic-bezier(0.22,1,0.36,1)_both]",
                variantStyles[toast.variant]
              )}
            >
              <div
                className={cn(
                  "absolute left-0 top-3 bottom-3 w-1.5 rounded-full",
                  variantStripe[toast.variant]
                )}
                aria-hidden
              />
              <div className="relative flex items-start gap-3 pl-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    variantIconChip[toast.variant]
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
                </span>
                <p className="min-w-0 flex-1 pt-1 text-[0.9375rem] font-medium leading-snug tracking-tight">
                  {toast.message}
                </p>
              </div>
              {actions.length ? (
                <div className="relative mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/80 pt-3.5 dark:border-white/12">
                  {actions.map((action, index) => {
                    const tone = action.variant === "primary" ? "primary" : "secondary";
                    return (
                      <button
                        key={`${toast.id}-${index}-${action.label}`}
                        type="button"
                        onClick={action.onClick}
                        className={cn(
                          "rounded-xl px-3.5 py-2 text-xs font-semibold tracking-tight transition active:translate-y-px",
                          tone === "primary"
                            ? "bg-slate-900 text-white shadow-[0_1px_0_0_rgba(255,255,255,0.2)_inset,0_6px_14px_-4px_rgba(15,23,42,0.45)] hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_18px_-6px_rgba(0,0,0,0.55)] dark:hover:bg-slate-100"
                            : "border border-slate-300/90 bg-linear-to-b from-white to-slate-50 text-slate-800 shadow-[0_1px_0_0_rgba(255,255,255,0.95)_inset,0_4px_10px_-4px_rgba(15,23,42,0.12)] hover:to-white dark:border-white/15 dark:from-slate-800 dark:to-slate-900 dark:text-slate-100 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset,0_6px_14px_-6px_rgba(0,0,0,0.45)]"
                        )}
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
