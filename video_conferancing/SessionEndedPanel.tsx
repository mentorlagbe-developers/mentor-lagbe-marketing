"use client";

import { Button } from "@/app/components/ui/button";

type SessionEndedPanelProps = {
  onReturn?: () => void;
};

export function SessionEndedPanel({ onReturn }: SessionEndedPanelProps) {
  return (
    <div className="flex min-h-[min(72vh,640px)] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session ended</p>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        You have left the live session. You can return to your dashboard anytime.
      </p>
      {onReturn ? (
        <Button variant="primary" onClick={onReturn}>
          Return to dashboard
        </Button>
      ) : null}
    </div>
  );
}
