"use client";

import { JoinMeetingButton } from "@/app/components/ui/join-meeting-button";
import {
  meetingJoinDisabledTitle,
  useMeetingJoinAccess,
} from "@/lib/session-join-timing";
import type { MentorSession } from "@/app/dashboard/_components/mentor/mentor-session-utils";

type MentorJoinMeetingButtonProps = {
  session: MentorSession | Record<string, unknown>;
  href?: string | null;
  inAppSessionId?: string;
  variant?: "full" | "compact";
  className?: string;
};

export function MentorJoinMeetingButton({
  session,
  href,
  inAppSessionId,
  variant = "compact",
  className,
}: MentorJoinMeetingButtonProps) {
  const record = session as Record<string, unknown>;
  const joinAccess = useMeetingJoinAccess(record);
  const meetLink =
    href ??
    (typeof record.meetLink === "string" ? record.meetLink : undefined) ??
    (typeof record.meet_link === "string" ? record.meet_link : undefined);
  const sessionId =
    inAppSessionId ??
    (typeof record.id === "string" ? record.id : undefined);

  if (!meetLink?.trim() && !sessionId) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  const isExpired = joinAccess.reason === "after_end";
  const isTerminal = joinAccess.reason === "terminal_status";

  return (
    <JoinMeetingButton
      href={meetLink}
      inAppSessionId={sessionId}
      meetRole="mentor"
      variant={variant}
      className={className}
      disabled={!joinAccess.canJoin}
      disabledVariant={isExpired || isTerminal ? "expired" : "muted"}
      disabledTitle={meetingJoinDisabledTitle(joinAccess)}
    />
  );
}
