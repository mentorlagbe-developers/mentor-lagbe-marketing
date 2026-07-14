import { apiFetch } from "@/lib/api";

export type MentorEarningsBucket = {
  count: number;
  sessionPriceBdt: string;
  mentorEarningsBdt: string;
  platformFeeBdt: string;
};

export type MentorEarningsSummary = {
  mentorSharePercent: number;
  platformSharePercent: number;
  approved: MentorEarningsBucket;
  pending: MentorEarningsBucket;
};

export type MentorEarningsItem = {
  sessionId: string;
  sessionReadableId: string;
  sessionDate: string;
  sessionStatus: string;
  payoutStatus: string;
  sessionPriceBdt: string;
  mentorSharePercent: number;
  platformSharePercent: number;
  mentorEarningsBdt: string;
  platformFeeBdt: string;
  sessionEndedAt: string;
  createdAt: string;
};

export type ListMentorEarningsParams = {
  page?: number;
  limit?: number;
  payoutStatus?: string;
};

export type ListMentorEarningsResult = {
  summary: MentorEarningsSummary;
  items: MentorEarningsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const EMPTY_BUCKET: MentorEarningsBucket = {
  count: 0,
  sessionPriceBdt: "0",
  mentorEarningsBdt: "0",
  platformFeeBdt: "0",
};

const EMPTY_SUMMARY: MentorEarningsSummary = {
  mentorSharePercent: 0,
  platformSharePercent: 0,
  approved: { ...EMPTY_BUCKET },
  pending: { ...EMPTY_BUCKET },
};

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeBucket(raw: unknown): MentorEarningsBucket {
  if (!raw || typeof raw !== "object") return { ...EMPTY_BUCKET };
  const r = raw as Record<string, unknown>;
  return {
    count: num(r.count),
    sessionPriceBdt: str(r.sessionPriceBdt) || str(r.session_price_bdt) || "0",
    mentorEarningsBdt: str(r.mentorEarningsBdt) || str(r.mentor_earnings_bdt) || "0",
    platformFeeBdt: str(r.platformFeeBdt) || str(r.platform_fee_bdt) || "0",
  };
}

function normalizeSummary(raw: unknown): MentorEarningsSummary {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SUMMARY };
  const r = raw as Record<string, unknown>;
  return {
    mentorSharePercent: num(r.mentorSharePercent) || num(r.mentor_share_percent),
    platformSharePercent: num(r.platformSharePercent) || num(r.platform_share_percent),
    approved: normalizeBucket(r.approved),
    pending: normalizeBucket(r.pending),
  };
}

function normalizeItem(raw: Record<string, unknown>): MentorEarningsItem {
  return {
    sessionId: str(raw.sessionId) || str(raw.session_id),
    sessionReadableId: str(raw.sessionReadableId) || str(raw.session_readable_id),
    sessionDate: str(raw.sessionDate) || str(raw.session_date),
    sessionStatus: str(raw.sessionStatus) || str(raw.session_status, "unknown"),
    payoutStatus: str(raw.payoutStatus) || str(raw.payout_status, "unknown"),
    sessionPriceBdt: str(raw.sessionPriceBdt) || str(raw.session_price_bdt) || "0",
    mentorSharePercent: num(raw.mentorSharePercent) || num(raw.mentor_share_percent),
    platformSharePercent: num(raw.platformSharePercent) || num(raw.platform_share_percent),
    mentorEarningsBdt: str(raw.mentorEarningsBdt) || str(raw.mentor_earnings_bdt) || "0",
    platformFeeBdt: str(raw.platformFeeBdt) || str(raw.platform_fee_bdt) || "0",
    sessionEndedAt: str(raw.sessionEndedAt) || str(raw.session_ended_at),
    createdAt: str(raw.createdAt) || str(raw.created_at),
  };
}

function unwrapResult(raw: unknown): ListMentorEarningsResult {
  if (!raw || typeof raw !== "object") {
    return {
      summary: { ...EMPTY_SUMMARY },
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    };
  }

  const r = raw as Record<string, unknown>;
  const itemsRaw = r.items ?? r.data;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
        .map(normalizeItem)
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
    summary: normalizeSummary(r.summary),
    items,
    pagination: { page, limit, total: Number.isFinite(total) ? total : items.length, totalPages },
  };
}

export async function listMentorEarnings(
  params?: ListMentorEarningsParams,
): Promise<ListMentorEarningsResult> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.payoutStatus) search.set("payoutStatus", params.payoutStatus);
  const qs = search.toString();
  const raw = await apiFetch<unknown>(`/live-sessions/mentor/earnings${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
  return unwrapResult(raw);
}

export function formatBdtAmount(amount: string): string {
  const n = Number(amount.replace(/,/g, ""));
  if (!Number.isFinite(n)) return amount || "0";
  return n.toLocaleString("en-BD", { maximumFractionDigits: 2 });
}
