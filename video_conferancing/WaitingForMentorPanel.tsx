"use client";

import { Loader2 } from "lucide-react";

export function WaitingForMentorPanel() {
  return (
    <div className="flex min-h-[min(72vh,640px)] flex-col items-center justify-center gap-4 rounded-xl border border-sky-200 bg-sky-50 p-8 text-center dark:border-sky-900/50 dark:bg-sky-950/40">
      <Loader2 className="size-8 animate-spin text-sky-600 dark:text-sky-400" aria-hidden />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Waiting for your mentor
        </p>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
          Your mentor needs to join first to start the room. This page will connect automatically
          once they are ready.
        </p>
      </div>
    </div>
  );
}
