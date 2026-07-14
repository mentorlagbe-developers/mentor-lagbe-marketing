import { apiFetch } from "@/lib/api";

export type StudentPaymentType = "session" | "certification";

export type StudentPaymentItem = {
  type: StudentPaymentType;
  id: string;
  bookingId: string;
  bookingReadableId: string;
  amountBdt: string;
  paymentMethod: string;
  trxId: string;
  payerNumber: string;
  referenceCode: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  title: string;
  sessionDate: string | null;
  examCode: string | null;
};

export type ListMyPaymentsParams = {
  page?: number;
  limit?: number;
  type?: StudentPaymentType;
  status?: string;
};

export type ListMyPaymentsResult = {
  items: StudentPaymentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function normalizePaymentItem(raw: Record<string, unknown>): StudentPaymentItem {
  const typeRaw = str(raw.type).toLowerCase();
  const type: StudentPaymentType = typeRaw === "certification" ? "certification" : "session";

  return {
    type,
    id: str(raw.id),
    bookingId: str(raw.bookingId) || str(raw.booking_id),
    bookingReadableId:
      str(raw.bookingReadableId) || str(raw.booking_readable_id) || str(raw.sessionReadableId),
    amountBdt: str(raw.amountBdt) || str(raw.amount_bdt) || "0",
    paymentMethod: str(raw.paymentMethod) || str(raw.payment_method),
    trxId: str(raw.trxId) || str(raw.trx_id),
    payerNumber: str(raw.payerNumber) || str(raw.payer_number),
    referenceCode: str(raw.referenceCode) || str(raw.reference_code),
    status: str(raw.status, "unknown"),
    submittedAt: str(raw.submittedAt) || str(raw.submitted_at),
    reviewedAt: str(raw.reviewedAt) || str(raw.reviewed_at) || null,
    rejectionReason: str(raw.rejectionReason) || str(raw.rejection_reason) || null,
    title: str(raw.title) || (type === "certification" ? "Certification exam" : "Live session"),
    sessionDate: str(raw.sessionDate) || str(raw.session_date) || null,
    examCode: str(raw.examCode) || str(raw.exam_code) || null,
  };
}

function unwrapList(raw: unknown): ListMyPaymentsResult {
  if (!raw || typeof raw !== "object") {
    return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
  }
  const r = raw as Record<string, unknown>;
  const itemsRaw = r.items ?? r.data;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map(normalizePaymentItem)
    : [];
  const pag =
    r.pagination && typeof r.pagination === "object"
      ? (r.pagination as Record<string, unknown>)
      : {};
  const page = Number(pag.page) || 1;
  const limit = Number(pag.limit) || items.length || 20;
  const total = Number(pag.total) ?? items.length;
  const totalPages = Number(pag.totalPages) || Math.max(1, Math.ceil(total / limit) || 1);
  return {
    items,
    pagination: { page, limit, total: Number.isFinite(total) ? total : items.length, totalPages },
  };
}

export async function listMyPayments(params?: ListMyPaymentsParams): Promise<ListMyPaymentsResult> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.type) search.set("type", params.type);
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  const raw = await apiFetch<unknown>(`/payments/me${qs ? `?${qs}` : ""}`, { auth: true });
  return unwrapList(raw);
}

/** Calendar day for table date column and filters (YYYY-MM-DD). */
export function paymentDisplayDate(item: StudentPaymentItem): string {
  if (item.sessionDate?.trim()) return item.sessionDate.trim().slice(0, 10);
  if (item.submittedAt?.trim()) return item.submittedAt.trim().slice(0, 10);
  return "—";
}

export function matchesPaymentSearch(item: StudentPaymentItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    item.referenceCode,
    item.bookingReadableId,
    item.trxId,
    item.title,
    item.examCode,
    item.payerNumber,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function matchesPaymentDate(item: StudentPaymentItem, dateFilter: string): boolean {
  if (!dateFilter.trim()) return true;
  const day = paymentDisplayDate(item);
  return day === dateFilter;
}

export type PaymentUiStatus = "completed" | "pending" | "failed";

export function toPaymentUiStatus(status: string): PaymentUiStatus {
  const s = status.toLowerCase();
  if (s === "approved") return "completed";
  if (s === "rejected" || s === "refunded") return "failed";
  return "pending";
}
