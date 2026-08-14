// Shared session normalizer for mentor components

import { calendarDateFromApiValue, calendarDateFromRecord, localYmd } from "@/lib/session-datetime";
import { isSessionScheduledInFuture, sessionEndMsFromRecord, sessionStartMsFromRecord } from "@/lib/session-join-timing";
import { sessionReadableIdFromRecord } from "@/lib/session-readable-id";

export type MentorSession = {
  id: string;
  readableId: string;
  status: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceBdt: string;
  topicName: string;
  customTopicName: string;
  studentId: string;
  studentName: string;
  studentGender: string;
  studentReadableId: string;
  meetLink: string;
  createdAt: string;
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

export function getSessionReadableId(item: Record<string, unknown>): string {
  return sessionReadableIdFromRecord(item);
}

function getStudentField(item: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const direct = str(item[key]);
    if (direct) return direct;
  }
  // nested student object
  const s = item.student ?? item.studentProfile ?? item.studentInfo;
  if (s && typeof s === "object") {
    const sr = s as Record<string, unknown>;
    for (const key of keys) {
      const v = str(sr[key]);
      if (v) return v;
    }
  }
  return "";
}

function getTopicName(item: Record<string, unknown>): string {
  for (const key of ["topicName", "topic_name", "topicTitle", "subjectName"]) {
    const v = str(item[key]);
    if (v) return v;
  }
  if (item.topic && typeof item.topic === "object") {
    const t = item.topic as Record<string, unknown>;
    for (const key of ["name", "title", "label"]) {
      const v = str(t[key]);
      if (v) return v;
    }
  }
  return "";
}

function getCustomTopicName(item: Record<string, unknown>): string {
  for (const key of ["customTopicName", "custom_topic_name"]) {
    const v = str(item[key]);
    if (v) return v;
  }
  return "";
}

export function sessionTopicLabel(session: Pick<MentorSession, "customTopicName" | "topicName">): string {
  return session.customTopicName?.trim() || session.topicName?.trim() || "—";
}

function getStudentReadableId(item: Record<string, unknown>): string {
  for (const key of ["studentReadableId", "student_readable_id"]) {
    const v = str(item[key]);
    if (v) return v;
  }
  const nested = item.student ?? item.studentProfile ?? item.studentInfo;
  if (nested && typeof nested === "object") {
    const sr = nested as Record<string, unknown>;
    for (const key of ["studentReadableId", "student_readable_id", "readableId", "readable_id"]) {
      const v = str(sr[key]);
      if (v) return v;
    }
  }
  return "";
}

export function normalizeSession(item: Record<string, unknown>): MentorSession {
  const sessionDate =
    calendarDateFromRecord(item) ||
    calendarDateFromApiValue(str(item.sessionDate)) ||
    calendarDateFromApiValue(str(item.session_date));
  return {
    id: str(item.id, crypto.randomUUID()),
    readableId: getSessionReadableId(item),
    status: str(item.status, "unknown"),
    sessionDate,
    startTime: str(item.startTime) || str(item.start_time) || str(item.startTime12h),
    endTime: str(item.endTime) || str(item.end_time) || str(item.endTime12h),
    meetLink: str(item.meetLink) || str(item.meet_link),
    durationMinutes: num(item.durationMinutes),
    priceBdt: str(item.priceBdt) || str(item.price_bdt, "0"),
    topicName: getTopicName(item),
    customTopicName: getCustomTopicName(item),
    studentId: getStudentField(item, "studentId", "student_id", "userId"),
    studentName: getStudentField(item, "studentName", "student_name", "fullName", "name"),
    studentGender: getStudentField(item, "studentGender", "student_gender", "gender"),
    studentReadableId: getStudentReadableId(item),
    createdAt: str(item.createdAt) || str(item.created_at),
  };
}

export async function fetchMentorSessions(apiFetch: <T>(path: string, opts?: Record<string, unknown>) => Promise<T>): Promise<MentorSession[]> {
  let raw: unknown;
  try {
    raw = await apiFetch("/live-sessions/mentor/sessions", { auth: true });
  } catch {
    try {
      raw = await apiFetch("/live-sessions/sessions/me", { auth: true });
    } catch {
      try {
        raw = await apiFetch("/live-sessions/bookings/me", { auth: true });
      } catch {
        return [];
      }
    }
  }

  let records: Record<string, unknown>[] = [];
  if (Array.isArray(raw)) {
    records = raw.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
  } else if (raw && typeof raw === "object") {
    const src = raw as Record<string, unknown>;
    const inner = src.items ?? src.sessions ?? src.bookings ?? src.data;
    if (Array.isArray(inner)) {
      records = inner.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"));
    }
  }
  return records.map(normalizeSession);
}

export function formatTime(raw: string): string {
  if (!raw) return "-";
  const [h, m] = raw.slice(0, 5).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw.slice(0, 5);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

export function formatStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  return calendarDateFromApiValue(dateStr) === localYmd();
}

export function mentorSessionToTimingRecord(
  session: Pick<
    MentorSession,
    "status" | "sessionDate" | "startTime" | "endTime" | "durationMinutes"
  >,
): Record<string, unknown> {
  return {
    status: session.status,
    sessionDate: session.sessionDate,
    session_date: session.sessionDate,
    startTime: session.startTime,
    start_time: session.startTime,
    endTime: session.endTime,
    end_time: session.endTime,
    durationMinutes: session.durationMinutes,
    duration_minutes: session.durationMinutes,
  };
}

/** Active status and session start is still in the future (or later today). */
export function isMentorSessionUpcoming(
  session: Pick<
    MentorSession,
    "status" | "sessionDate" | "startTime" | "endTime" | "durationMinutes"
  >,
  nowMs = Date.now(),
): boolean {
  return (
    isUpcomingLiveSession(session.status) &&
    isSessionScheduledInFuture(mentorSessionToTimingRecord(session), nowMs)
  );
}

export function dashboardSessionToTimingRecord(session: {
  status?: string;
  session_date?: string;
  sessionDate?: string;
  start_time?: string;
  startTime?: string;
  startTime12h?: string;
  end_time?: string;
  endTime?: string;
  endTime12h?: string;
  duration_minutes?: number;
  durationMinutes?: number;
}): Record<string, unknown> {
  return {
    status: session.status,
    session_date: session.session_date ?? session.sessionDate,
    sessionDate: session.sessionDate ?? session.session_date,
    start_time: session.start_time ?? session.startTime ?? session.startTime12h,
    startTime: session.startTime ?? session.start_time ?? session.startTime12h,
    startTime12h: session.startTime12h,
    end_time: session.end_time ?? session.endTime ?? session.endTime12h,
    endTime: session.endTime ?? session.end_time ?? session.endTime12h,
    duration_minutes: session.duration_minutes ?? session.durationMinutes,
    durationMinutes: session.durationMinutes ?? session.duration_minutes,
  };
}

/** Active status and session has not ended yet (includes live sessions in progress). */
export function isMentorSessionNotEnded(
  session: Pick<
    MentorSession,
    "status" | "sessionDate" | "startTime" | "endTime" | "durationMinutes"
  >,
  nowMs = Date.now(),
): boolean {
  if (!isUpcomingLiveSession(session.status)) return false;
  const rec = mentorSessionToTimingRecord(session);
  const endMs = sessionEndMsFromRecord(rec);
  if (endMs !== null) return endMs > nowMs;
  return isSessionScheduledInFuture(rec, nowMs);
}

/** Dashboard row: active and not ended (for upcoming table + join button). */
export function isDashboardSessionNotEnded(
  session: Parameters<typeof dashboardSessionToTimingRecord>[0],
  nowMs = Date.now(),
): boolean {
  if (!isUpcomingLiveSession(session.status)) return false;
  const rec = dashboardSessionToTimingRecord(session);
  const endMs = sessionEndMsFromRecord(rec);
  if (endMs !== null) return endMs > nowMs;
  return isSessionScheduledInFuture(rec, nowMs);
}

export function canShowMentorJoinButton(
  session: Pick<MentorSession, "status" | "meetLink">,
): boolean {
  if (!session.meetLink?.trim()) return false;
  const s = (session.status ?? "").toLowerCase();
  return !s.includes("cancel") && !s.includes("declin") && !s.includes("rejected");
}

export function canShowMentorJoinForDashboardRow(
  session: Parameters<typeof dashboardSessionToTimingRecord>[0] & { meet_link?: string },
): boolean {
  if (!session.meet_link?.trim()) return false;
  const s = (session.status ?? "").toLowerCase();
  return !s.includes("cancel") && !s.includes("declin") && !s.includes("rejected");
}

/** Active status and session start is still in the future (dashboard row shape). */
export function isDashboardSessionUpcoming(
  session: Parameters<typeof dashboardSessionToTimingRecord>[0],
  nowMs = Date.now(),
): boolean {
  return (
    isUpcomingLiveSession(session.status) &&
    isSessionScheduledInFuture(dashboardSessionToTimingRecord(session), nowMs)
  );
}

/** Accepted / approved sessions that are not finished yet (status-only; prefer isMentorSessionUpcoming). */
export function isUpcomingLiveSession(status = ""): boolean {
  const s = status.toLowerCase();
  if (
    s.includes("completed") ||
    s.includes("cancel") ||
    s.includes("declin") ||
    s.includes("expired") ||
    s.includes("rejected") ||
    s.includes("failed")
  ) {
    return false;
  }
  return (
    s.includes("accepted") ||
    s.includes("approved") ||
    s.includes("mentor_accepted") ||
    s.includes("scheduled") ||
    s.includes("confirmed") ||
    s.includes("paid") ||
    s.includes("active")
  );
}

export type MentorHistoryFilter = "all" | "upcoming" | "approved" | "pending" | "canceled";

export function matchesMentorHistoryFilter(
  session: Pick<
    MentorSession,
    "status" | "sessionDate" | "startTime" | "endTime" | "durationMinutes"
  >,
  filter: MentorHistoryFilter,
  nowMs = Date.now(),
): boolean {
  const status = session.status;
  const s = status.toLowerCase();
  if (filter === "all") return true;
  if (filter === "upcoming") return isMentorSessionUpcoming(session, nowMs);
  if (filter === "approved") {
    return (
      s.includes("approved") ||
      s.includes("accepted") ||
      s.includes("confirmed") ||
      s.includes("scheduled") ||
      s.includes("paid")
    );
  }
  if (filter === "pending") {
    return s.includes("pending") || s.includes("waiting") || s === "pending_mentor";
  }
  if (filter === "canceled") {
    return s.includes("cancel") || s.includes("declin") || s.includes("expired") || s.includes("rejected");
  }
  return true;
}

export function statusTone(status: string): "success" | "warning" | "danger" | "info" {
  const s = status.toLowerCase();
  if (s.includes("completed") || s.includes("accepted") || s.includes("confirmed") || s.includes("approved")) return "success";
  if (s.includes("pending") || s.includes("waiting")) return "warning";
  if (s.includes("cancel") || s.includes("declined") || s.includes("expired") || s.includes("failed")) return "danger";
  return "info";
}

export function compareMentorSessionsByStartAsc(
  a: Pick<MentorSession, "sessionDate" | "startTime">,
  b: Pick<MentorSession, "sessionDate" | "startTime">,
): number {
  const aMs = sessionStartMsFromRecord(mentorSessionToTimingRecord(a as MentorSession)) ?? 0;
  const bMs = sessionStartMsFromRecord(mentorSessionToTimingRecord(b as MentorSession)) ?? 0;
  if (aMs !== bMs) return aMs - bMs;
  return (a.sessionDate ?? "").localeCompare(b.sessionDate ?? "");
}

export function compareMentorSessionsByStartDesc(
  a: Pick<MentorSession, "sessionDate" | "startTime">,
  b: Pick<MentorSession, "sessionDate" | "startTime">,
): number {
  return -compareMentorSessionsByStartAsc(a, b);
}

export function toneClasses(tone: "success" | "warning" | "danger" | "info"): string {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/25 dark:text-emerald-300";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/25 dark:text-amber-300";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/25 dark:text-rose-300";
  return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/40 dark:bg-sky-900/25 dark:text-sky-300";
}
