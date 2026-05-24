"use client";

import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { isJitsiEnabled } from "./jitsi-env";

type JoinSessionButtonProps = {
  sessionId: string;
  disabled?: boolean;
  variant?: "full" | "compact";
  className?: string;
  /** Legacy external URL when Jitsi disabled */
  legacyHref?: string | null;
};

export function JoinSessionButton({
  sessionId,
  disabled,
  variant = "full",
  className,
  legacyHref,
}: JoinSessionButtonProps) {
  const router = useRouter();
  const jitsiOn = isJitsiEnabled();

  const fullCls =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition";
  const compactCls =
    "inline-flex min-w-[7.5rem] items-center justify-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition";
  const enabledCls =
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-900/25 dark:text-emerald-300";
  const disabledCls =
    "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500";

  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? "Join not available yet" : "Join session"}
      onClick={() => {
        if (disabled) return;
        if (jitsiOn) {
          router.push(`/dashboard/meet/${encodeURIComponent(sessionId)}`);
          return;
        }
        const url = legacyHref?.trim();
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }}
      className={cn(variant === "full" ? fullCls : compactCls, disabled ? disabledCls : enabledCls, className)}
    >
      <Video className={variant === "full" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      Join session
    </button>
  );
}
