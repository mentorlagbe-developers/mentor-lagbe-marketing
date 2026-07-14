// Shared session normalizer for mentor components

import { calendarDateFromApiValue, calendarDateFromRecord, localYmd } from "@/lib/session-datetime";
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
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
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
  for (const key of ["topicName", "topicTitle", "subjectName", "courseName", "courseTitle"]) {
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
    customTopicName: str(item.customTopicName),
    studentId: getStudentField(item, "studentId", "userId"),
    studentName: getStudentField(item, "studentName", "fullName", "name"),
    studentGender: getStudentField(item, "studentGender", "gender"),
    studentReadableId: getStudentField(
      item,
      "studentReadableId",
      "student_readable_id",
      "readableId",
    ),
    createdAt: str(item.createdAt),
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

/** Accepted / approved sessions that are not finished yet (for upcoming lists). */
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

export function matchesMentorHistoryFilter(status: string, filter: MentorHistoryFilter): boolean {
  const s = status.toLowerCase();
  if (filter === "all") return true;
  if (filter === "upcoming") return isUpcomingLiveSession(status);
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
  if (s.includes("completed") || s.includes("accepted") || s.includes("confirmed")) return "success";
  if (s.includes("pending") || s.includes("waiting")) return "warning";
  if (s.includes("cancel") || s.includes("declined") || s.includes("expired") || s.includes("failed")) return "danger";
  return "info";
}

export function toneClasses(tone: "success" | "warning" | "danger" | "info"): string {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/25 dark:text-emerald-300";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/25 dark:text-amber-300";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/25 dark:text-rose-300";
  return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/40 dark:bg-sky-900/25 dark:text-sky-300";
}
