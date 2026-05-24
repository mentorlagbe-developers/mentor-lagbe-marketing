import { apiFetch } from "@/lib/api";

export type PendingPayment = {
  id: string;
  sessionId?: string;
  sessionReadableId?: string;
  studentName?: string;
  amountBdt?: string;
  paymentMethod?: string;
  trxId?: string;
  payerNumber?: string;
  referenceCode?: string;
  status?: string;
  submittedAt?: string;
};

export type SessionPendingPayment = {
  id: string;
  status: string;
  amountBdt: string;
  paymentMethod: string;
  trxId: string;
  payerNumber: string;
  referenceCode: string;
  submittedAt?: string;
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function paymentFromNestedBlock(block: Record<string, unknown>): SessionPendingPayment | null {
  const id = str(block.id) || str(block.paymentId);
  if (!id) return null;
  return {
    id,
    status: str(block.status) || "payment_submitted",
    amountBdt: str(block.amountBdt) || String(block.amountBdt ?? ""),
    paymentMethod: str(block.paymentMethod),
    trxId: str(block.trxId),
    payerNumber: str(block.payerNumber),
    referenceCode: str(block.referenceCode),
    submittedAt: str(block.submittedAt) || str(block.createdAt) || undefined,
  };
}

/** True when super-admin should show approve/reject payment actions. */
export function canReviewSessionPayment(payment: SessionPendingPayment | null): boolean {
  if (!payment?.id) return false;
  const s = payment.status.toLowerCase().replace(/\s+/g, "_");
  if (
    s.includes("approved") ||
    s.includes("rejected") ||
    s.includes("failed") ||
    s.includes("cancel") ||
    s.includes("expired")
  ) {
    return false;
  }
  return (
    s.includes("submit") ||
    s.includes("pending") ||
    s.includes("review") ||
    s === "submitted" ||
    s === "payment_submitted"
  );
}

/** Resolve pending payment from session list row or session detail payload. */
export function extractSessionPendingPayment(source: Record<string, unknown>): SessionPendingPayment | null {
  const direct = parseSessionPendingPayment(source);
  if (direct?.id && canReviewSessionPayment(direct)) return direct;

  for (const key of ["payment", "paymentDetails", "paymentInfo", "billing"]) {
    const block = source[key];
    if (block && typeof block === "object" && !Array.isArray(block)) {
      const parsed = paymentFromNestedBlock(block as Record<string, unknown>);
      if (parsed?.id && canReviewSessionPayment(parsed)) return parsed;
    }
  }

  if (direct?.id && canReviewSessionPayment(direct)) return direct;
  return null;
}

/** Load submitted payments keyed by mentorship session id. */
export async function fetchPendingPaymentsBySessionId(): Promise<Map<string, PendingPayment>> {
  const raw = await apiFetch<unknown>("/admin/payments/pending?page=1&limit=100", { auth: true });
  const list = parsePendingPaymentList(raw);
  const map = new Map<string, PendingPayment>();
  for (const p of list) {
    if (p.sessionId) map.set(p.sessionId, p);
  }
  return map;
}

export function pendingPaymentFromListItem(item: PendingPayment): SessionPendingPayment {
  return {
    id: item.id,
    status: item.status ?? "submitted",
    amountBdt: item.amountBdt ?? "",
    paymentMethod: item.paymentMethod ?? "",
    trxId: item.trxId ?? "",
    payerNumber: item.payerNumber ?? "",
    referenceCode: item.referenceCode ?? "",
    submittedAt: item.submittedAt,
  };
}

/**
 * Resolve reviewable payment for a session row/detail.
 * Prefers API `pendingPayment` on the session; falls back to pending-payments list by session id.
 */
export function resolvePendingPaymentForSession(
  source: Record<string, unknown>,
  sessionId: string,
  pendingBySessionId: Map<string, PendingPayment>,
): SessionPendingPayment | null {
  const fromSession = extractSessionPendingPayment(source);
  if (fromSession?.id && canReviewSessionPayment(fromSession)) {
    return fromSession;
  }

  const fromList = pendingBySessionId.get(sessionId);
  if (fromList && canReviewSessionPayment(pendingPaymentFromListItem(fromList))) {
    return pendingPaymentFromListItem(fromList);
  }

  return null;
}

export function parseSessionPendingPayment(raw: Record<string, unknown>): SessionPendingPayment | null {
  const nested = raw.pendingPayment;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const p = nested as Record<string, unknown>;
    const id = str(p.id);
    if (id) {
      return {
        id,
        status: str(p.status) || "submitted",
        amountBdt: str(p.amountBdt) || String(p.amountBdt ?? ""),
        paymentMethod: str(p.paymentMethod),
        trxId: str(p.trxId),
        payerNumber: str(p.payerNumber),
        referenceCode: str(p.referenceCode),
        submittedAt: str(p.submittedAt) || undefined,
      };
    }
  }

  const id = str(raw.pendingPaymentId);
  if (!id) return null;

  return {
    id,
    status: str(raw.pendingPaymentStatus) || "submitted",
    amountBdt: str(raw.pendingPaymentAmountBdt) || String(raw.pendingPaymentAmountBdt ?? ""),
    paymentMethod: str(raw.pendingPaymentMethod),
    trxId: str(raw.pendingPaymentTrxId),
    payerNumber: str(raw.pendingPaymentPayerNumber),
    referenceCode: str(raw.pendingPaymentReferenceCode),
    submittedAt: str(raw.pendingPaymentSubmittedAt) || undefined,
  };
}

export function parsePendingPaymentList(raw: unknown): PendingPayment[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const items = r.items ?? r.data ?? r.payments ?? r.records;
  if (!Array.isArray(items)) return [];
  return items
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((item) => ({
      id: str(item.id),
      sessionId: str(item.sessionId) || undefined,
      sessionReadableId: str(item.sessionReadableId) || undefined,
      studentName: str(item.studentName) || undefined,
      amountBdt: str(item.amountBdt) || String(item.amountBdt ?? ""),
      paymentMethod: str(item.paymentMethod) || undefined,
      trxId: str(item.trxId) || undefined,
      payerNumber: str(item.payerNumber) || undefined,
      referenceCode: str(item.referenceCode) || undefined,
      status: str(item.status) || undefined,
      submittedAt: str(item.submittedAt) || undefined,
    }))
    .filter((p) => p.id);
}

export async function approveAdminPayment(paymentId: string) {
  return apiFetch<{ paymentId?: string; status?: string }>(
    `/admin/payments/${encodeURIComponent(paymentId)}/approve`,
    { method: "POST", auth: true },
  );
}

export async function rejectAdminPayment(paymentId: string, rejectionReason: string) {
  const reason = rejectionReason.trim() || "Payment could not be verified.";
  return apiFetch<{ paymentId?: string; status?: string }>(
    `/admin/payments/${encodeURIComponent(paymentId)}/reject`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ rejectionReason: reason }),
    },
  );
}
