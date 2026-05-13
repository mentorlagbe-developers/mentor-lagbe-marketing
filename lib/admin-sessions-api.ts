import { apiFetch } from "@/lib/api";

/** Many backends reject large `limit` values (e.g. Joi @Max(100)); keep requests within range. */
export const ADMIN_SESSIONS_LIST_MAX_LIMIT = 100;

export type AdminSessionRow = {
  id: string;
  readableId: string;
  status: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceBdt: string;
  studentId?: string | null;
  mentorId?: string | null;
  courseId?: string | null;
  topicId?: string | null;
  customTopicName?: string | null;
  problemDescription?: string | null;
  createdAt?: string;
  raw: Record<string, unknown>;
};

function pickString(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return fallback;
}

/** YYYY-MM-DD from plain date or ISO datetime string. */
function normalizeToYmd(value: string): string {
  const t = value.trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const ms = Date.parse(t);
  if (!Number.isNaN(ms)) {
    const d = new Date(ms);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  const m = t.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : t.slice(0, 10);
}

/** HH:mm:ss for table time column; accepts clock strings or ISO datetimes. */
function pickTimeFromRecord(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = record[key];
    if (typeof v !== "string" || !v.trim()) continue;
    const s = v.trim();
    if (s.includes("T") || s.endsWith("Z")) {
      const ms = Date.parse(s);
      if (!Number.isNaN(ms)) {
        const d = new Date(ms);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
      }
    }
    const clock = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (clock) {
      const h = Math.min(23, Math.max(0, parseInt(clock[1], 10)));
      const min = Math.min(59, Math.max(0, parseInt(clock[2], 10)));
      const sec = clock[3] !== undefined ? Math.min(59, Math.max(0, parseInt(clock[3], 10))) : 0;
      if (Number.isFinite(h) && Number.isFinite(min)) {
        return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
      }
    }
  }
  return "";
}

function pickNumber(record: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return fallback;
}

export function toAdminSessionRow(record: Record<string, unknown>): AdminSessionRow {
  const id = pickString(record, ["id", "sessionId", "uuid"], crypto.randomUUID());
  const readableId =
    pickString(record, ["readableId", "sessionReadableId", "bookingReadableId", "code"], "") || id.slice(0, 8);

  const dateRaw = pickString(
    record,
    ["sessionDate", "date", "scheduledDate", "scheduledAt", "sessionStartAt", "startDateTime", "sessionDateTime"],
    ""
  );
  const sessionDate = dateRaw ? normalizeToYmd(dateRaw) : "";

  let startTime = pickTimeFromRecord(record, ["startTime", "sessionStartTime", "scheduledStart", "sessionStartAt"]);
  if (!startTime && dateRaw && (dateRaw.includes("T") || dateRaw.endsWith("Z"))) {
    startTime = pickTimeFromRecord(record, ["sessionDate", "scheduledAt", "startDateTime", "sessionDateTime"]);
  }
  if (!startTime) {
    startTime = pickString(record, ["startTime", "sessionStartTime"], "");
  }

  let endTime = pickTimeFromRecord(record, ["endTime", "sessionEndTime", "scheduledEnd", "sessionEndAt"]);
  if (!endTime) {
    endTime = pickString(record, ["endTime", "sessionEndTime"], "");
  }

  return {
    id,
    readableId,
    status: pickString(record, ["status", "sessionStatus", "state"], "unknown"),
    sessionDate,
    startTime,
    endTime,
    durationMinutes: pickNumber(record, ["durationMinutes", "duration"], 0),
    priceBdt: pickString(record, ["priceBdt", "price", "amountBdt", "totalBdt"], "0"),
    studentId: pickString(record, ["studentId", "studentUserId"], "") || null,
    mentorId: pickString(record, ["mentorId", "mentorUserId", "assignedMentorId"], "") || null,
    courseId: pickString(record, ["courseId"], "") || null,
    topicId: pickString(record, ["topicId"], "") || null,
    customTopicName: pickString(record, ["customTopicName", "topicName"], "") || null,
    problemDescription: pickString(record, ["problemDescription", "description", "notes"], "") || null,
    createdAt: pickString(record, ["createdAt"], "") || undefined,
    raw: record,
  };
}

function unwrapSessionList(data: unknown): { rows: AdminSessionRow[]; stats?: Record<string, unknown> } {
  if (Array.isArray(data)) {
    return { rows: data.filter(Boolean).map((item) => toAdminSessionRow(item as Record<string, unknown>)) };
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const stats =
      (obj.stats as Record<string, unknown> | undefined) ||
      (obj.summary as Record<string, unknown> | undefined) ||
      (obj.aggregates as Record<string, unknown> | undefined);
    const items = obj.items ?? obj.sessions ?? obj.records ?? obj.data ?? obj.results;
    if (Array.isArray(items)) {
      return {
        rows: items.filter(Boolean).map((item) => toAdminSessionRow(item as Record<string, unknown>)),
        stats,
      };
    }
    return { rows: [toAdminSessionRow(obj)] };
  }
  return { rows: [] };
}

export type SessionStats = {
  totalRequested: number;
  totalCompleted: number;
  totalPending: number;
  totalCanceled: number;
};

function pickStatNum(stats: Record<string, unknown> | undefined, keys: string[]): number | null {
  if (!stats) return null;
  for (const key of keys) {
    const v = stats[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

/** Map API status into one of four dashboard buckets (best-effort; unknown → pending). */
export function bucketAdminSessionStatus(status: string): "requested" | "completed" | "pending" | "canceled" {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  if (s.includes("cancel") || s.includes("reject") || s.includes("refund_denied")) return "canceled";
  if (s.includes("complete") || s.includes("done") || s.includes("closed")) return "completed";
  if (
    s.includes("request") ||
    s.includes("seek") ||
    s.includes("open") ||
    s.includes("broadcast") ||
    s.includes("waiting_for") ||
    s === "new"
  ) {
    return "requested";
  }
  if (
    s.includes("pending") ||
    s.includes("schedule") ||
    s.includes("await") ||
    s.includes("confirm") ||
    s.includes("accept") ||
    s.includes("progress") ||
    s.includes("paid") ||
    s.includes("active")
  ) {
    return "pending";
  }
  return "pending";
}

export function computeSessionStats(rows: AdminSessionRow[], stats?: Record<string, unknown>): SessionStats {
  let requested = 0;
  let completed = 0;
  let pending = 0;
  let canceled = 0;
  for (const row of rows) {
    const b = bucketAdminSessionStatus(row.status);
    if (b === "requested") requested += 1;
    else if (b === "completed") completed += 1;
    else if (b === "canceled") canceled += 1;
    else pending += 1;
  }
  const computed = { totalRequested: requested, totalCompleted: completed, totalPending: pending, totalCanceled: canceled };

  if (!stats) return computed;

  const apiRequested = pickStatNum(stats, ["totalRequested", "requested", "requestedCount", "totalRequests"]);
  const apiCompleted = pickStatNum(stats, ["totalCompleted", "completed", "completedCount"]);
  const apiPending = pickStatNum(stats, ["totalPending", "pending", "pendingCount"]);
  const apiCanceled = pickStatNum(stats, ["totalCanceled", "totalCancelled", "canceled", "cancelled", "canceledCount"]);

  const allFromApi =
    apiRequested !== null && apiCompleted !== null && apiPending !== null && apiCanceled !== null;
  if (allFromApi) {
    return {
      totalRequested: apiRequested,
      totalCompleted: apiCompleted,
      totalPending: apiPending,
      totalCanceled: apiCanceled,
    };
  }

  return {
    totalRequested: apiRequested ?? computed.totalRequested,
    totalCompleted: apiCompleted ?? computed.totalCompleted,
    totalPending: apiPending ?? computed.totalPending,
    totalCanceled: apiCanceled ?? computed.totalCanceled,
  };
}

export async function listAdminSessions(query?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === "") continue;
      if (k === "limit" || k === "take" || k === "pageSize") {
        const n = Number(v);
        if (Number.isFinite(n) && n > 0) {
          params.set(k, String(Math.min(Math.floor(n), ADMIN_SESSIONS_LIST_MAX_LIMIT)));
        } else {
          params.set(k, String(v));
        }
        continue;
      }
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  const path = qs ? `/admin/sessions?${qs}` : "/admin/sessions";
  const data = await apiFetch<unknown>(path, { auth: true });
  const { rows, stats } = unwrapSessionList(data);
  const statsComputed = computeSessionStats(rows, stats);
  return { rows, stats, statsComputed };
}

export async function getAdminSession(sessionId: string) {
  const data = await apiFetch<unknown>(`/admin/sessions/${encodeURIComponent(sessionId)}`, { auth: true });
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  if (Array.isArray(data) && data[0] && typeof data[0] === "object") {
    return data[0] as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
}

export async function getAdminSessionEligibleMentors(sessionId: string) {
  const data = await apiFetch<unknown>(
    `/admin/sessions/${encodeURIComponent(sessionId)}/eligible-mentors`,
    { auth: true }
  );
  if (Array.isArray(data)) {
    return data.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object")) as Record<
      string,
      unknown
    >[];
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const list = obj.mentors ?? obj.items ?? obj.data ?? obj.results;
    if (Array.isArray(list)) {
      return list.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object")) as Record<
        string,
        unknown
      >[];
    }
  }
  return [] as Record<string, unknown>[];
}

/** Drop undefined / null / empty strings so PATCH validators do not receive invalid empty fields. */
export function compactSessionPatchBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(body)) {
    if (raw === undefined || raw === null) continue;
    if (typeof raw === "string" && !raw.trim()) continue;
    if (key === "priceBdt" && typeof raw === "string") {
      const n = Number(raw.trim());
      if (!Number.isNaN(n) && raw.trim() !== "") out[key] = n;
      else out[key] = raw.trim();
      continue;
    }
    out[key] = raw;
  }
  return out;
}

export async function patchAdminSession(sessionId: string, body: Record<string, unknown>) {
  const compact = compactSessionPatchBody(body);
  return apiFetch<unknown>(`/admin/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(Object.keys(compact).length ? compact : {}),
  });
}

export async function approveAdminSession(sessionId: string) {
  return patchAdminSession(sessionId, { status: "approved" });
}
