"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidMeetingJoinUrl } from "@/lib/meet-link";
import { MEETING_JOIN_CONSENT, type PolicyConsentConfig } from "@/lib/policy-consents";
import { PolicyConsentModal } from "@/app/components/ui/policy-consent-modal";
import { isJitsiEnabled } from "@/video_conferancing/jitsi-env";

type JoinMeetingButtonProps = {
  /** Static meeting URL (mentor / pre-resolved link). */
  href?: string | null;
  /** Fetch meeting URL after consent (student join API). */
  resolveMeetingUrl?: () => Promise<string | null>;
  /** Session/booking UUID for in-app Jitsi room (`/dashboard/meet/...`). */
  inAppSessionId?: string;
  /** `mentor` loads mentor jitsi-conference config; default student. */
  meetRole?: "student" | "mentor";
  consent?: PolicyConsentConfig;
  variant?: "full" | "compact";
  className?: string;
  disabled?: boolean;
};

function openMeetingUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Join with privacy/recording consent first; never renders the raw URL. */
export function JoinMeetingButton({
  href,
  resolveMeetingUrl,
  inAppSessionId,
  meetRole = "student",
  consent = MEETING_JOIN_CONSENT,
  variant = "full",
  className,
  disabled = false,
}: JoinMeetingButtonProps) {
  const router = useRouter();
  const [consentOpen, setConsentOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const jitsiInApp = isJitsiEnabled() && Boolean(inAppSessionId?.trim());
  const hasStaticUrl = Boolean(href?.trim() && isValidMeetingJoinUrl(href));
  const canAttemptJoin = Boolean(jitsiInApp || hasStaticUrl || resolveMeetingUrl) && !disabled;

  const fullCls =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition";
  const compactCls =
    "inline-flex min-w-[7.5rem] items-center justify-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition";
  const enabledCls =
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-900/25 dark:text-emerald-300";
  const disabledCls =
    "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500";

  const handleContinue = useCallback(async () => {
    setBusy(true);
    setErrorMessage(null);
    try {
      if (jitsiInApp && inAppSessionId) {
        setConsentOpen(false);
        const q = meetRole === "mentor" ? "?role=mentor" : "";
        router.push(`/dashboard/meet/${encodeURIComponent(inAppSessionId)}${q}`);
        return;
      }

      let url = href?.trim() ?? "";
      if (resolveMeetingUrl) {
        const resolved = await resolveMeetingUrl();
        url = resolved?.trim() ?? "";
      }
      if (!url || !isValidMeetingJoinUrl(url)) {
        setErrorMessage("Meeting room is not ready yet. Please try again shortly.");
        return;
      }
      setConsentOpen(false);
      openMeetingUrl(url);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open the meeting room.");
    } finally {
      setBusy(false);
    }
  }, [href, resolveMeetingUrl, jitsiInApp, inAppSessionId, meetRole, router]);

  return (
    <>
      <button
        type="button"
        disabled={!canAttemptJoin}
        title={
          disabled
            ? "Join is not available yet"
            : canAttemptJoin
              ? "Review privacy notice and join session"
              : "No meeting room available"
        }
        onClick={() => {
          if (!canAttemptJoin) return;
          setErrorMessage(null);
          setConsentOpen(true);
        }}
        className={cn(variant === "full" ? fullCls : compactCls, canAttemptJoin ? enabledCls : disabledCls, className)}
      >
        <ExternalLink className={variant === "full" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        Join meeting
      </button>

      <PolicyConsentModal
        open={consentOpen}
        config={consent}
        busy={busy}
        errorMessage={errorMessage}
        onClose={() => {
          if (busy) return;
          setConsentOpen(false);
          setErrorMessage(null);
        }}
        onContinue={handleContinue}
      />
    </>
  );
}
