"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidGoogleMeetUrl } from "@/lib/meet-link";

type JoinMeetingButtonProps = {
  href?: string | null;
  variant?: "full" | "compact";
  className?: string;
};

/** Opens Meet in a new tab; never renders the raw URL. Disabled when link is missing or invalid. */
export function JoinMeetingButton({ href, variant = "full", className }: JoinMeetingButtonProps) {
  const url = href?.trim() ?? "";
  const ok = isValidGoogleMeetUrl(url);
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
      disabled={!ok}
      title={
        !url
          ? "No meeting link"
          : ok
            ? "Open Google Meet in a new tab"
            : "Meeting link is invalid or incomplete"
      }
      onClick={() => {
        if (!ok || !url) return;
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      className={cn(variant === "full" ? fullCls : compactCls, ok ? enabledCls : disabledCls, className)}
    >
      <ExternalLink className={variant === "full" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      Join meeting
    </button>
  );
}
