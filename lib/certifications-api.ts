"use client";

import { apiFetch } from "@/lib/api";
import { formatBdPhoneForCertPayment } from "@/lib/bd-phone";

export type CertificationExamCard = {
  id: string;
  examCode: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  level: "beginner" | "intermediate" | "advanced" | "all_levels";
  originalPriceBdt: string;
  salePriceBdt: string | null;
  effectivePriceBdt: string;
  discountPercent: number;
  studentCount: number;
  lessonCount: number;
  ratingAverage: number;
  ratingCount: number;
  certificateAvailable: boolean;
  includesTraining: boolean;
  isOfficialVoucher: boolean;
  thumbnailUrl?: string | null;
  badgeLabel?: string | null;
  isFeatured: boolean;
  vendor: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type CertificationListResponse = {
  items: CertificationExamCard[];
  total: number;
  page: number;
  limit: number;
  filters: {
    vendors: Array<{ id: string; name: string; slug: string }>;
    categories: Array<{ id: string; name: string; slug: string }>;
    levels: string[];
  };
};

export type CertificationVendor = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
};

export type CertificationCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
};

export type CertificationExamDetail = CertificationExamCard & {
  overview?: string | null;
  prerequisites?: string | null;
  examFormat?: string | null;
  languages?: string | null;
  examDurationMinutes?: number | null;
  passingScorePercent?: number | null;
  materials: Array<{
    id: string;
    title: string;
    description?: string | null;
    materialType: string;
    isPreview: boolean;
    externalUrl?: string | null;
    fileUrl?: string | null;
    durationSec?: number | null;
  }>;
};

export type CertificationBooking = {
  id: string;
  readableId: string;
  status: string;
  amountBdt: string;
  paymentDeadlineAt?: string | null;
  voucherCode?: string | null;
  fulfilledAt?: string | null;
  createdAt: string;
  examId: string;
  examCode: string;
  slug: string;
  examTitle: string;
  thumbnailUrl?: string | null;
  vendorName: string;
};

export type CertificationBookingDetail = CertificationBooking & {
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentReferenceCode?: string | null;
  paymentMethod?: string | null;
  trxId?: string | null;
  payerNumber?: string | null;
  submittedAt?: string | null;
  voucherNotes?: string | null;
};

export type CertificationPaymentMethod = "bkash" | "nagad";

export type CertificationPaymentPayload = {
  paymentMethod: CertificationPaymentMethod;
  amountBdt: number;
  trxId: string;
  payerNumber: string;
};

export type CertificationPaymentResponse = {
  id: string;
  bookingId: string;
  amountBdt: string;
  paymentMethod: CertificationPaymentMethod;
  trxId: string;
  payerNumber: string;
  referenceCode?: string | null;
  status: string;
  submittedAt?: string | null;
};

export type CertificationBookingCreateResponse = {
  id: string;
  readableId: string;
  status: string;
  examId?: string;
  amountBdt?: string;
  paymentDeadlineAt?: string | null;
};

type ListCertificationExamsOptions = {
  auth?: boolean;
};

function toNum(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toStr(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeBooking(item: Record<string, unknown>): CertificationBooking {
  return {
    id: toStr(item.id),
    readableId: toStr(item.readableId) || toStr(item.readable_id) || "N/A",
    status: toStr(item.status, "unknown"),
    amountBdt: toStr(item.amountBdt) || toStr(item.amount_bdt) || "0",
    paymentDeadlineAt: toStr(item.paymentDeadlineAt) || toStr(item.payment_deadline_at) || null,
    voucherCode: toStr(item.voucherCode) || toStr(item.voucher_code) || null,
    fulfilledAt: toStr(item.fulfilledAt) || toStr(item.fulfilled_at) || null,
    createdAt: toStr(item.createdAt) || toStr(item.created_at),
    examId: toStr(item.examId) || toStr(item.exam_id),
    examCode: toStr(item.examCode) || toStr(item.exam_code),
    slug: toStr(item.slug),
    examTitle: toStr(item.examTitle) || toStr(item.exam_title),
    thumbnailUrl: toStr(item.thumbnailUrl) || toStr(item.thumbnail_url) || null,
    vendorName: toStr(item.vendorName) || toStr(item.vendor_name),
  };
}

function normalizeBookingDetail(item: Record<string, unknown>): CertificationBookingDetail {
  return {
    ...normalizeBooking(item),
    paymentId: toStr(item.paymentId) || toStr(item.payment_id) || null,
    paymentStatus: toStr(item.paymentStatus) || toStr(item.payment_status) || null,
    paymentReferenceCode: toStr(item.paymentReferenceCode) || toStr(item.payment_reference_code) || null,
    paymentMethod: toStr(item.paymentMethod) || toStr(item.payment_method) || null,
    trxId: toStr(item.trxId) || toStr(item.trx_id) || null,
    payerNumber: toStr(item.payerNumber) || toStr(item.payer_number) || null,
    submittedAt: toStr(item.submittedAt) || toStr(item.submitted_at) || null,
    voucherNotes: toStr(item.voucherNotes) || toStr(item.voucher_notes) || null,
  };
}

function normalizeExamCard(item: CertificationExamCard): CertificationExamCard {
  const salePriceRaw = item.salePriceBdt as unknown;
  const salePriceBdt =
    salePriceRaw === null || salePriceRaw === undefined || salePriceRaw === ""
      ? null
      : toStr(salePriceRaw, "");
  return {
    ...item,
    ratingAverage: toNum(item.ratingAverage),
    ratingCount: toNum(item.ratingCount),
    studentCount: toNum(item.studentCount),
    lessonCount: toNum(item.lessonCount),
    discountPercent: toNum(item.discountPercent),
    effectivePriceBdt: toStr(item.effectivePriceBdt, "0"),
    originalPriceBdt: toStr(item.originalPriceBdt, "0"),
    salePriceBdt,
  };
}

function normalizeExamDetail(item: CertificationExamDetail): CertificationExamDetail {
  return {
    ...normalizeExamCard(item),
    examDurationMinutes: toNum(item.examDurationMinutes ?? null, 0) || null,
    passingScorePercent: toNum(item.passingScorePercent ?? null, 0) || null,
    materials: Array.isArray(item.materials) ? item.materials : [],
  };
}

export async function listCertificationExams(
  params?: Record<string, string>,
  options?: ListCertificationExamsOptions
) {
  const search = params ? `?${new URLSearchParams(params).toString()}` : "";
  try {
    const data = await apiFetch<CertificationListResponse>(`/certifications/exams${search}`, {
      auth: options?.auth,
    });
    return {
      ...data,
      items: Array.isArray(data.items) ? data.items.map(normalizeExamCard) : [],
      total: toNum(data.total),
      page: toNum(data.page, 1),
      limit: toNum(data.limit, 12),
      filters: data.filters ?? { vendors: [], categories: [], levels: [] },
    };
  } catch (error) {
    // Some backend deployments reject/500 on pagination query params for this endpoint.
    // Retry once without query params so UI still renders available exams.
    if (search) {
      const data = await apiFetch<CertificationListResponse>("/certifications/exams", {
        auth: options?.auth,
      });
      return {
        ...data,
        items: Array.isArray(data.items) ? data.items.map(normalizeExamCard) : [],
        total: toNum(data.total),
        page: toNum(data.page, 1),
        limit: toNum(data.limit, 12),
        filters: data.filters ?? { vendors: [], categories: [], levels: [] },
      };
    }
    throw error;
  }
}

export async function getCertificationExam(idOrSlug: string) {
  const data = await apiFetch<CertificationExamDetail>(`/certifications/exams/${encodeURIComponent(idOrSlug)}`);
  return normalizeExamDetail(data);
}

export async function listCertificationVendors() {
  return apiFetch<CertificationVendor[]>("/certifications/vendors");
}

export async function listCertificationCategories() {
  return apiFetch<CertificationCategory[]>("/certifications/categories");
}

export async function bookCertificationExam(examId: string): Promise<CertificationBookingCreateResponse> {
  const data = await apiFetch<Record<string, unknown>>(`/certifications/exams/${encodeURIComponent(examId)}/book`, {
    method: "POST",
    auth: true,
  });

  const id = toStr(data.id, "");
  const readableId = toStr(data.readableId, "") || toStr(data.readable_id, "");
  const status = toStr(data.status, "");
  const returnedExamId = toStr(data.examId, "") || toStr(data.exam_id, "");
  const amountBdt = toStr(data.amountBdt, "") || toStr(data.amount_bdt, "");
  const paymentDeadlineAt = toStr(data.paymentDeadlineAt, "") || toStr(data.payment_deadline_at, "");

  return {
    id,
    readableId,
    status,
    examId: returnedExamId || undefined,
    amountBdt: amountBdt || undefined,
    paymentDeadlineAt: paymentDeadlineAt || null,
  };
}

export async function listMyCertificationBookings() {
  const data = await apiFetch<{ items: Array<Record<string, unknown>>; pagination: { total: number } }>(
    "/certifications/bookings/me",
    { auth: true }
  );
  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeBooking) : [],
  };
}

export async function getMyCertificationBooking(bookingId: string) {
  const data = await apiFetch<Record<string, unknown>>(
    `/certifications/bookings/me/${encodeURIComponent(bookingId)}`,
    { auth: true }
  );
  return normalizeBookingDetail(data);
}

/** Backend allows cancel only before payment is approved / voucher issued. */
export function studentCertificationBookingCanCancel(status: string): boolean {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  return s === "pending_payment" || s === "payment_submitted";
}

export async function cancelMyCertificationBooking(
  bookingId: string,
  cancellationReason?: string,
): Promise<CertificationBookingDetail> {
  const trimmed = cancellationReason?.trim();
  const data = await apiFetch<Record<string, unknown>>(
    `/certifications/bookings/me/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(trimmed ? { cancellationReason: trimmed } : {}),
    },
  );
  return normalizeBookingDetail(data);
}

/** Match booking amount to 2 decimal places for API validation. */
export function normalizeCertificationAmountBdt(value: string | number): number {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

export function buildCertificationPaymentPayload(
  payload: CertificationPaymentPayload,
): CertificationPaymentPayload {
  return {
    paymentMethod: payload.paymentMethod,
    amountBdt: normalizeCertificationAmountBdt(payload.amountBdt),
    trxId: payload.trxId.trim(),
    payerNumber: formatBdPhoneForCertPayment(payload.payerNumber),
  };
}

export async function payMyCertificationBooking(
  bookingId: string,
  payload: CertificationPaymentPayload
): Promise<CertificationPaymentResponse> {
  const body = buildCertificationPaymentPayload(payload);
  const data = await apiFetch<Record<string, unknown>>(
    `/certifications/bookings/me/${encodeURIComponent(bookingId)}/pay`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    }
  );
  return {
    id: toStr(data.id),
    bookingId: toStr(data.bookingId) || toStr(data.booking_id),
    amountBdt: toStr(data.amountBdt) || toStr(data.amount_bdt) || "0",
    paymentMethod: (toStr(data.paymentMethod) || toStr(data.payment_method) || payload.paymentMethod) as CertificationPaymentMethod,
    trxId: toStr(data.trxId) || toStr(data.trx_id),
    payerNumber: toStr(data.payerNumber) || toStr(data.payer_number),
    referenceCode: toStr(data.referenceCode) || toStr(data.reference_code) || null,
    status: toStr(data.status, "submitted"),
    submittedAt: toStr(data.submittedAt) || toStr(data.submitted_at) || null,
  };
}

export async function uploadCertificationImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<{ imageUrl: string; filename: string; size: number; mimetype: string }>(
    "/certifications/exams/image",
    {
      method: "POST",
      auth: true,
      body: formData,
      headers: {},
    }
  );
}
