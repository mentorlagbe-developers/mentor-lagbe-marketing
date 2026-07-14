import { apiFetch } from "@/lib/api";

export type MentorStudentHistoryItem = {
  id: string;
  readableId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  startTime12h: string;
  endTime12h: string;
  durationMinutes: number;
  priceBdt: string;
  status: string;
  courseName: string;
  departmentName: string;
  topicName: string;
  customTopicName: string;
  studentReadableId: string;
};

export type MentorStudentHistoryParams = {
  page?: number;
  limit?: number;
  status?: string;
};

export type MentorStudentHistoryResult = {
  items: MentorStudentHistoryItem[];
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

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function normalizeItem(raw: Record<string, unknown>): MentorStudentHistoryItem {
  return {
    id: str(raw.id),
    readableId: str(raw.readableId) || str(raw.readable_id),
    sessionDate: str(raw.sessionDate) || str(raw.session_date),
    startTime: str(raw.startTime) || str(raw.start_time),
    endTime: str(raw.endTime) || str(raw.end_time),
    startTime12h: str(raw.startTime12h) || str(raw.start_time_12h),
    endTime12h: str(raw.endTime12h) || str(raw.end_time_12h),
    durationMinutes: num(raw.durationMinutes) || num(raw.duration_minutes),
    priceBdt: str(raw.priceBdt) || str(raw.price_bdt),
    status: str(raw.status, "unknown"),
    courseName: str(raw.courseName) || str(raw.course_name),
    departmentName: str(raw.departmentName) || str(raw.department_name),
    topicName: str(raw.topicName) || str(raw.topic_name),
    customTopicName: str(raw.customTopicName) || str(raw.custom_topic_name),
    studentReadableId:
      str(raw.studentReadableId) || str(raw.student_readable_id) || "—",
  };
}

function unwrapList(raw: unknown): MentorStudentHistoryResult {
  if (!raw || typeof raw !== "object") {
    return { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } };
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
    items,
    pagination: { page, limit, total: Number.isFinite(total) ? total : items.length, totalPages },
  };
}

export async function listMentorStudentHistory(
  params?: MentorStudentHistoryParams,
): Promise<MentorStudentHistoryResult> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  const raw = await apiFetch<unknown>(`/live-sessions/mentor/student-history${qs ? `?${qs}` : ""}`, {
    auth: true,
  });
  return unwrapList(raw);
}

export function historyTopicLabel(item: MentorStudentHistoryItem): string {
  return item.customTopicName || item.topicName || item.courseName || "—";
}

export function countUniqueStudents(items: MentorStudentHistoryItem[]): number {
  return new Set(items.map((item) => item.studentReadableId).filter((id) => id && id !== "—")).size;
}

export function countByStatus(items: MentorStudentHistoryItem[], matcher: (status: string) => boolean): number {
  return items.filter((item) => matcher(item.status.toLowerCase())).length;
}
