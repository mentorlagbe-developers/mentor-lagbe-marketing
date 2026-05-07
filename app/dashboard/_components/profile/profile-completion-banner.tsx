"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { useProfileStatus } from "@/app/dashboard/_components/profile-status-context";

export function ProfileCompletionBanner() {
  const router = useRouter();
  const { isLoading, needsCompletionForLiveSession } = useProfileStatus();

  if (isLoading || !needsCompletionForLiveSession) return null;

  return (
    <div className="sticky top-15 z-10 border-b border-amber-200 bg-amber-50 px-6 py-3 dark:border-amber-900/40 dark:bg-amber-900/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          Complete your profile to continue Live Session booking and joining.
        </p>
        <Button size="sm" onClick={() => router.push("/dashboard/profile")}>
          Complete Profile
        </Button>
      </div>
    </div>
  );
}
