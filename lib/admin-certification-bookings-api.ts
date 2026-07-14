import { apiFetch } from "@/lib/api";

export type AdminCertificationBooking = {
  id: string;
  readableId: string;
  status: string;
  amountBdt: string;
  examId?: string;
  examTitle?: string;
  examCode?: string;
  vendorName?: string;
  studentId?: string;
  studentName?: string;
  studentReadableId?: string;
  paymentId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  trxId?: string;
  payerNumber?: string;
  paymentReferenceCode?: string;
  submittedAt?: string;
  paymentDeadlineAt?: string | null;
  voucherCode?: string | null;
  voucherNotes?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
  fulfilledAt?: string | null;
};

export type AdminCertificationBookingsListParams = {
  page?: number;
  limit?: number;
  status?: string;
};

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function amountStr(v: unknown): string {
  const s = str(v);
  if (s) return s;
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  return "";
}

function paymentBlockFromRaw(raw: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of [
    "payment",
    "latestPayment",
    "latest_payment",
    "submittedPayment",
    "pendingPayment",
    "lastPayment",
  ]) {
    const block = raw[key];
    if (block && typeof block === "object" && !Array.isArray(block)) {
      return block as Record<string, unknown>;
    }
  }
  const payments = raw.payments;
  if (Array.isArray(payments) && payments.length > 0) {
    const first = payments[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return first as Record<string, unknown>;
    }
  }
  return null;
}

function normalizeAdminCertificationBooking(raw: Record<string, unknown>): AdminCertificationBooking {
  const student = raw.student;
  const exam = raw.exam;
  const payment = paymentBlockFromRaw(raw);

  let studentName = str(raw.studentName) || str(raw.student_name);
  let studentReadableId = str(raw.studentReadableId) || str(raw.student_readable_id);
  if (student && typeof student === "object" && !Array.isArray(student)) {
    const s = student as Record<string, unknown>;
    studentName = studentName || str(s.fullName) || str(s.name) || str(s.displayName);
    studentReadableId = studentReadableId || str(s.readableId) || str(s.readable_id);
  }

  let examTitle = str(raw.examTitle) || str(raw.exam_title);
  let examCode = str(raw.examCode) || str(raw.exam_code);
  let vendorName = str(raw.vendorName) || str(raw.vendor_name);
  if (exam && typeof exam === "object" && !Array.isArray(exam)) {
    const e = exam as Record<string, unknown>;
    examTitle = examTitle || str(e.title) || str(e.name);
    examCode = examCode || str(e.examCode) || str(e.exam_code) || str(e.code);
    vendorName = vendorName || str(e.vendorName) || str(e.vendor_name);
    const vendor = e.vendor;
    if (vendor && typeof vendor === "object" && !Array.isArray(vendor)) {
      vendorName = vendorName || str((vendor as Record<string, unknown>).name);
    }
  }

  let paymentMethod = str(raw.paymentMethod) || str(raw.payment_method);
  let trxId = str(raw.trxId) || str(raw.trx_id) || str(raw.transactionId) || str(raw.transaction_id);
  let payerNumber =
    str(raw.payerNumber) || str(raw.payer_number) || str(raw.payerPhone) || str(raw.payer_phone);
  let paymentStatus = str(raw.paymentStatus) || str(raw.payment_status);
  let paymentReferenceCode = str(raw.paymentReferenceCode) || str(raw.payment_reference_code);
  let submittedAt = str(raw.submittedAt) || str(raw.submitted_at);
  let paymentId = str(raw.paymentId) || str(raw.payment_id);
  let amountBdt = amountStr(raw.amountBdt) || amountStr(raw.amount_bdt);
  if (payment) {
    const p = payment;
    paymentId = paymentId || str(p.id);
    paymentMethod = paymentMethod || str(p.paymentMethod) || str(p.payment_method) || str(p.method);
    trxId =
      trxId ||
      str(p.trxId) ||
      str(p.trx_id) ||
      str(p.transactionId) ||
      str(p.transaction_id);
    payerNumber =
      payerNumber ||
      str(p.payerNumber) ||
      str(p.payer_number) ||
      str(p.payerPhone) ||
      str(p.payer_phone);
    paymentStatus = paymentStatus || str(p.status) || str(p.paymentStatus);
    paymentReferenceCode =
      paymentReferenceCode || str(p.referenceCode) || str(p.reference_code);
    submittedAt = submittedAt || str(p.submittedAt) || str(p.submitted_at);
    amountBdt = amountBdt || amountStr(p.amountBdt) || amountStr(p.amount_bdt);
  }

  return {
    id: str(raw.id),
    readableId: str(raw.readableId) || str(raw.readable_id) || str(raw.id).slice(0, 8),
    status: str(raw.status, "unknown"),
    amountBdt: amountBdt || "0",
    examId: str(raw.examId) || str(raw.exam_id) || undefined,
    examTitle: examTitle || undefined,
    examCode: examCode || undefined,
    vendorName: vendorName || undefined,
    studentId: str(raw.studentId) || str(raw.student_id) || undefined,
    studentName: studentName || undefined,
    studentReadableId: studentReadableId || undefined,
    paymentId: paymentId || undefined,
    paymentStatus: paymentStatus || undefined,
    paymentMethod: paymentMethod || undefined,
    trxId: trxId || undefined,
    payerNumber: payerNumber || undefined,
    paymentReferenceCode: paymentReferenceCode || undefined,
    submittedAt: submittedAt || undefined,
    paymentDeadlineAt: str(raw.paymentDeadlineAt) || str(raw.payment_deadline_at) || null,
    voucherCode: str(raw.voucherCode) || str(raw.voucher_code) || null,
    voucherNotes: str(raw.voucherNotes) || str(raw.voucher_notes) || null,
    rejectionReason: str(raw.rejectionReason) || str(raw.rejection_reason) || null,
    createdAt: str(raw.createdAt) || str(raw.created_at) || undefined,
    fulfilledAt: str(raw.fulfilledAt) || str(raw.fulfilled_at) || null,
  };
}

function unwrapBookingsList(raw: unknown): { items: AdminCertificationBooking[]; total: number } {
  if (Array.isArray(raw)) {
    return {
      items: raw
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map(normalizeAdminCertificationBooking),
      total: raw.length,
    };
  }
  if (!raw || typeof raw !== "object") return { items: [], total: 0 };
  const r = raw as Record<string, unknown>;
  const itemsRaw = r.items ?? r.data ?? r.bookings ?? r.records ?? r.results;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map(normalizeAdminCertificationBooking)
    : [];
  const total =
    typeof r.total === "number"
      ? r.total
      : typeof r.pagination === "object" && r.pagination
        ? Number((r.pagination as Record<string, unknown>).total) || items.length
        : items.length;
  return { items, total: Number.isFinite(total) ? total : items.length };
}

export async function listAdminCertificationBookings(params?: AdminCertificationBookingsListParams) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status && params.status !== "all") search.set("status", params.status);
  const qs = search.toString();
  const raw = await apiFetch<unknown>(`/admin/certification-bookings${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
  return unwrapBookingsList(raw);
}

export async function approveAdminCertificationPayment(bookingId: string) {
  return apiFetch<Record<string, unknown>>(
    `/admin/certification-bookings/${encodeURIComponent(bookingId)}/approve-payment`,
    { method: "POST", auth: true },
  );
}

export async function rejectAdminCertificationPayment(bookingId: string, rejectionReason: string) {
  const trimmed = rejectionReason.trim();
  const reason =
    trimmed.length >= 3 ? trimmed : "Payment could not be verified.";
  return apiFetch<Record<string, unknown>>(
    `/admin/certification-bookings/${encodeURIComponent(bookingId)}/reject-payment`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ rejectionReason: reason }),
    },
  );
}

export type AdminCertificationVoucherPayload = {
  voucherCode: string;
  voucherNotes?: string;
};

export async function patchAdminCertificationVoucher(
  bookingId: string,
  payload: AdminCertificationVoucherPayload,
) {
  return apiFetch<Record<string, unknown>>(
    `/admin/certification-bookings/${encodeURIComponent(bookingId)}/voucher`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({
        voucherCode: payload.voucherCode.trim(),
        ...(payload.voucherNotes?.trim() ? { voucherNotes: payload.voucherNotes.trim() } : {}),
      }),
    },
  );
}

export function canReviewCertificationPayment(booking: AdminCertificationBooking): boolean {
  const status = booking.status.toLowerCase().replace(/\s+/g, "_");
  const payStatus = (booking.paymentStatus ?? "").toLowerCase().replace(/\s+/g, "_");
  if (status.includes("cancel")) return false;
  if (status === "pending_payment" || status.includes("payment_rejected")) return false;
  if (status.includes("payment_approved") || status.includes("voucher") || status.includes("fulfilled")) {
    return false;
  }
  return (
    status === "payment_submitted" ||
    status.includes("payment_submitted") ||
    payStatus === "submitted" ||
    payStatus === "payment_submitted" ||
    payStatus.includes("under_review")
  );
}

export function canIssueCertificationVoucher(booking: AdminCertificationBooking): boolean {
  const status = booking.status.toLowerCase().replace(/\s+/g, "_");
  if (status.includes("voucher_issued") || status.includes("fulfilled")) {
    return !booking.voucherCode;
  }
  return status.includes("payment_approved");
}
