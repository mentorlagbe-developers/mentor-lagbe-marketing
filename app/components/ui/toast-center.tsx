"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "danger" | "warning" | "info";

export type ToastMessage = {
  id: number;
  variant: ToastVariant;
  message: string;
};

type ToastCenterProps = {
  toasts: ToastMessage[];
};

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-700",
  danger: "border-rose-200 bg-rose-50/95 text-rose-700",
  warning: "border-amber-200 bg-amber-50/95 text-amber-700",
  info: "border-sky-200 bg-sky-50/95 text-sky-700",
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
    <div className="pointer-events-none fixed inset-0 z-80 flex items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-2.5">
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant];

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-[0_20px_45px_-24px_rgba(15,23,42,0.55)] backdrop-blur",
                "animate-[toast-in_180ms_ease-out]",
                variantStyles[toast.variant]
              )}
            >
              <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <p className="leading-5">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
