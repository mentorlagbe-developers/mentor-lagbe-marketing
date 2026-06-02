"use client";

import { apiFetch } from "@/lib/api";

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

export async function bookCertificationExam(examId: string) {
  return apiFetch<{ id: string; readableId: string; status: string }>(
    `/certifications/exams/${encodeURIComponent(examId)}/book`,
    { method: "POST", auth: true }
  );
}

export async function listMyCertificationBookings() {
  return apiFetch<{ items: CertificationBooking[]; pagination: { total: number } }>(
    "/certifications/bookings/me",
    { auth: true }
  );
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
