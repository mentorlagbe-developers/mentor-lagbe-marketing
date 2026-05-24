export type JoinAccessState =
  | "payment_required"
  | "payment_under_review"
  | "payment_rejected"
  | "waiting_for_session_time"
  | "ready"
  | "payment_expired"
  | "unavailable"
  | "session_ended";

export type JoinAccess = {
  state: JoinAccessState;
  message: string;
  canJoin: boolean;
  rejectionReason?: string | null;
};

export function parseJoinAccess(raw: unknown): JoinAccess | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const state = r.state;
  if (typeof state !== "string") return null;
  const valid: JoinAccessState[] = [
    "payment_required",
    "payment_under_review",
    "payment_rejected",
    "waiting_for_session_time",
    "ready",
    "payment_expired",
    "unavailable",
    "session_ended",
  ];
  if (!valid.includes(state as JoinAccessState)) return null;
  return {
    state: state as JoinAccessState,
    message: typeof r.message === "string" ? r.message : "",
    canJoin: Boolean(r.canJoin),
    rejectionReason:
      typeof r.rejectionReason === "string"
        ? r.rejectionReason
        : typeof r.rejection_reason === "string"
          ? r.rejection_reason
          : null,
  };
}

export function joinAccessShowsPaymentForm(state: JoinAccessState) {
  return state === "payment_required" || state === "payment_rejected";
}
