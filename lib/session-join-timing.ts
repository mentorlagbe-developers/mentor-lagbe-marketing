"use client";

import { useEffect, useMemo, useState } from "react";
import { calendarDateFromApiValue, calendarDateFromRecord, localYmd } from "@/lib/session-datetime";

/** Parse "7:30 PM" or "19:30" / "19:30:00" to 24h "HH:mm". */
function clockTo24h(clock: string): string | null {
  const t = clock.trim();
  if (!t) return null;
  const twelve = t.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/i);
  if (twelve) {
    let h = parseInt(twelve[1], 10);
    const m = twelve[2];
    const ap = twelve[3].toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  const twentyFour = t.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFour) {
    return `${String(parseInt(twentyFour[1], 10)).padStart(2, "0")}:${twentyFour[2]}`;
  }
  return null;
}

function localWallClockMs(dateYmd: string, clock: string): number | null {
  const hm = clockTo24h(clock);
  if (!hm || !/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return null;
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const [h, min] = hm.split(":").map(Number);
  const t = new Date(y, mo - 1, d, h, min, 0, 0);
  const ms = t.getTime();
  return Number.isNaN(ms) ? null : ms;
}

function sessionDateYmd(sessionDate?: string | null): string {
  return (
    calendarDateFromApiValue(sessionDate ?? undefined) ||
    sessionDate?.trim().slice(0, 10) ||
    ""
  );
}

/** Session start instant in the user's local timezone. */
export function sessionStartMs(params: {
  sessionDate?: string | null;
  startTime?: string | null;
}): number | null {
  const startRaw = params.startTime?.trim();
  if (!startRaw) return null;

  if (startRaw.includes("T")) {
    const d = new Date(startRaw);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }

  const date = sessionDateYmd(params.sessionDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return localWallClockMs(date, startRaw);
}

/** Session end instant in the user's local timezone. */
export function sessionEndMs(params: {
  sessionDate?: string | null;
  endTime?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
}): number | null {
  const endRaw = params.endTime?.trim();
  const date = sessionDateYmd(params.sessionDate);

  if (endRaw) {
    if (endRaw.includes("T")) {
      const d = new Date(endRaw);
      return Number.isNaN(d.getTime()) ? null : d.getTime();
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const ms = localWallClockMs(date, endRaw);
      if (ms !== null) return ms;
    }
  }

  const startMs = sessionStartMs({ sessionDate: date, startTime: params.startTime });
  if (startMs === null) return null;

  const mins =
    typeof params.durationMinutes === "number" && params.durationMinutes > 0
      ? params.durationMinutes
      : 30;
  return startMs + mins * 60_000;
}

export function sessionStartMsFromRecord(record: Record<string, unknown>): number | null {
  const sessionDate =
    calendarDateFromRecord(record) ||
    calendarDateFromApiValue(
      typeof record.session_date === "string" ? record.session_date : undefined,
    ) ||
    calendarDateFromApiValue(
      typeof record.sessionDate === "string" ? record.sessionDate : undefined,
    );

  for (const key of [
    "start_time",
    "startTime",
    "startTime12h",
    "start_at",
    "session_start",
    "slot_start",
  ]) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) {
      const ms = sessionStartMs({ sessionDate, startTime: v });
      if (ms !== null) return ms;
    }
  }

  if (typeof record.session_date === "string" && record.session_date.includes("T")) {
    const d = new Date(record.session_date);
    if (!Number.isNaN(d.getTime())) return d.getTime();
  }

  return null;
}

export function sessionEndMsFromRecord(record: Record<string, unknown>): number | null {
  const sessionDate =
    calendarDateFromRecord(record) ||
    calendarDateFromApiValue(
      typeof record.session_date === "string" ? record.session_date : undefined,
    ) ||
    calendarDateFromApiValue(
      typeof record.sessionDate === "string" ? record.sessionDate : undefined,
    );

  let startTime: string | undefined;
  for (const key of ["start_time", "startTime", "startTime12h", "start_at", "session_start"]) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) {
      startTime = v;
      break;
    }
  }

  for (const key of ["end_time", "endTime", "endTime12h", "end_at", "session_end", "slot_end"]) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) {
      const ms = sessionEndMs({ sessionDate, endTime: v, startTime });
      if (ms !== null) return ms;
    }
  }

  const durationMinutes =
    typeof record.durationMinutes === "number"
      ? record.durationMinutes
      : typeof record.duration_minutes === "number"
        ? record.duration_minutes
        : null;

  return sessionEndMs({ sessionDate, startTime, durationMinutes });
}

export function isTerminalSessionStatus(status?: string | null): boolean {
  const s = (status ?? "").toLowerCase();
  return (
    s.includes("completed") ||
    s.includes("cancel") ||
    s.includes("declin") ||
    s.includes("expired") ||
    s.includes("rejected") ||
    s.includes("failed") ||
    s.includes("ended")
  );
}

export type MeetingJoinBlockReason = "unavailable" | "before_start" | "after_end" | "terminal_status";

export type MeetingJoinAccess = {
  canJoin: boolean;
  reason: MeetingJoinBlockReason | null;
  startMs: number | null;
  endMs: number | null;
};

const BLOCKED_ACCESS: MeetingJoinAccess = {
  canJoin: false,
  reason: "unavailable",
  startMs: null,
  endMs: null,
};

/** Join allowed only between session start and end, excluding closed statuses. */
export function evaluateMeetingJoinAccess(
  record: Record<string, unknown>,
  nowMs = Date.now(),
): MeetingJoinAccess {
  const status = typeof record.status === "string" ? record.status : "";
  const startMs = sessionStartMsFromRecord(record);
  const endMs = sessionEndMsFromRecord(record);

  if (isTerminalSessionStatus(status)) {
    return { canJoin: false, reason: "terminal_status", startMs, endMs };
  }

  if (startMs === null) {
    return { canJoin: false, reason: "unavailable", startMs, endMs };
  }

  if (nowMs < startMs) {
    return { canJoin: false, reason: "before_start", startMs, endMs };
  }

  if (endMs !== null && nowMs >= endMs) {
    return { canJoin: false, reason: "after_end", startMs, endMs };
  }

  return { canJoin: true, reason: null, startMs, endMs };
}

/**
 * True when the session start is still in the future (or now), matching mentor dashboard
 * "upcoming" semantics (same as backend: session_date/start_time not yet passed).
 */
export function isSessionScheduledInFuture(
  record: Record<string, unknown>,
  nowMs = Date.now(),
): boolean {
  const startMs = sessionStartMsFromRecord(record);
  if (startMs !== null) return startMs >= nowMs;

  const sessionDate =
    calendarDateFromRecord(record) ||
    calendarDateFromApiValue(
      typeof record.session_date === "string" ? record.session_date : undefined,
    ) ||
    calendarDateFromApiValue(
      typeof record.sessionDate === "string" ? record.sessionDate : undefined,
    );

  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) return false;
  const today = localYmd(new Date(nowMs));
  return sessionDate > today;
}

export function meetingJoinDisabledTitle(access: MeetingJoinAccess): string {
  switch (access.reason) {
    case "before_start":
      return "Join unlocks at session start time";
    case "after_end":
      return "This session has ended — join is no longer available";
    case "terminal_status":
      return "This session is closed — join is no longer available";
    case "unavailable":
      return "Session time unavailable";
    default:
      return "Join is not available";
  }
}

/** @deprecated Use evaluateMeetingJoinAccess */
export function canJoinMeetingNow(startMs: number | null, nowMs = Date.now()): boolean {
  if (startMs === null) return false;
  return nowMs >= startMs;
}

/** @deprecated Use meetingJoinDisabledTitle(evaluateMeetingJoinAccess(...)) */
export function mentorJoinDisabledTitle(startMs: number | null): string {
  return meetingJoinDisabledTitle({
    canJoin: canJoinMeetingNow(startMs),
    reason: startMs === null ? "unavailable" : canJoinMeetingNow(startMs) ? null : "before_start",
    startMs,
    endMs: null,
  });
}

/** Re-renders when join window opens or closes. */
export function useMeetingJoinAccess(record: Record<string, unknown> | null): MeetingJoinAccess {
  const [tick, setTick] = useState(0);

  const startMs = record ? sessionStartMsFromRecord(record) : null;
  const endMs = record ? sessionEndMsFromRecord(record) : null;

  useEffect(() => {
    if (!record) return;
    const timers: number[] = [];
    const now = Date.now();
    if (startMs !== null && now < startMs) {
      timers.push(window.setTimeout(() => setTick((n) => n + 1), startMs - now + 250));
    }
    if (endMs !== null && now < endMs) {
      timers.push(window.setTimeout(() => setTick((n) => n + 1), endMs - now + 250));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [record, startMs, endMs]);

  return useMemo(() => {
    void tick;
    return record ? evaluateMeetingJoinAccess(record) : BLOCKED_ACCESS;
  }, [record, tick]);
}
