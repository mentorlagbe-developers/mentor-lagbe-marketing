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

/** Countdown to pay only while the student still owes payment (not submitted / under review / approved). */
export function joinAccessShowsPaymentCountdown(state: JoinAccessState | undefined) {
  return state === "payment_required" || state === "payment_rejected";
}

const TERMINAL_JOIN_ACCESS: JoinAccessState[] = [
  "session_ended",
  "unavailable",
  "payment_expired",
  "ready",
  "waiting_for_session_time",
];

/** Whether the student can still cancel this booking from the dashboard. */
export function studentBookingCanCancel(params: {
  status: string;
  joinAccessState?: JoinAccessState | null;
  joinBlockReason?: string | null;
}): boolean {
  const state = params.joinAccessState ?? undefined;
  if (state && TERMINAL_JOIN_ACCESS.includes(state)) return false;

  if (params.joinBlockReason === "after_end" || params.joinBlockReason === "terminal_status") {
    return false;
  }

  const s = params.status.toLowerCase().replace(/\s+/g, "_");
  if (
    s.includes("cancel") ||
    s.includes("complete") ||
    s.includes("ended") ||
    s.includes("expir") ||
    s.includes("payment_approved") ||
    (s.includes("approved") && s.includes("payment"))
  ) {
    return false;
  }

  if (state === "payment_required" || state === "payment_rejected" || state === "payment_under_review") {
    return true;
  }

  return (
    s.includes("pending") ||
    s.includes("seeking") ||
    s.includes("requested") ||
    s.includes("broadcast") ||
    s === "payment_pending" ||
    s === "payment_submitted"
  );
}
