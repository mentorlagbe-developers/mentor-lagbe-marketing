/** Calendar dates in the user's local timezone (avoids UTC shift from toISOString()). */

export function localYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function localYmdOffsetDays(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return localYmd(d);
}

/** Normalize API date/datetime to YYYY-MM-DD in local timezone. */
export function calendarDateFromApiValue(raw?: string | null): string {
  if (!raw) return "";
  const t = String(raw).trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const ms = Date.parse(t);
  if (Number.isNaN(ms)) return t.slice(0, 10);
  return localYmd(new Date(ms));
}

export function calendarDateFromRecord(record: Record<string, unknown>): string {
  for (const key of [
    "sessionDate",
    "session_date",
    "scheduledDate",
    "scheduledAt",
    "sessionStartAt",
    "startDateTime",
    "sessionDateTime",
  ]) {
    const v = record[key];
    if (typeof v === "string" && v.trim()) {
      const ymd = calendarDateFromApiValue(v);
      if (ymd) return ymd;
    }
  }
  return "";
}

export type DayFilterKey = "today" | "yesterday" | "tomorrow" | "all";

export function ymdForDayFilter(filter: Exclude<DayFilterKey, "all">): string {
  const offset = filter === "today" ? 0 : filter === "yesterday" ? -1 : 1;
  return localYmdOffsetDays(offset);
}

export function matchesDayFilter(sessionDateYmd: string, filter: DayFilterKey): boolean {
  if (filter === "all") return true;
  if (!sessionDateYmd) return false;
  return sessionDateYmd === ymdForDayFilter(filter);
}
