/** Booking fields needed to resolve the next upcoming / in-progress session in local time. */
export type NextSessionPickFields = {
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
};

function isTerminalBookingStatus(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s.includes("completed") ||
    s.includes("cancel") ||
    s.includes("rejected") ||
    s.includes("declined") ||
    s.includes("expired") ||
    s.includes("failed")
  );
}

function timeToHm(raw: string): string {
  if (!raw) return "00:00";
  const normalized = raw.trim().slice(0, 8);
  const five = normalized.slice(0, 5);
  if (/^\d{1,2}:\d{2}$/.test(five)) return five;
  return "00:00";
}

function localWallClockMs(dateYmd: string, hm: string): number | null {
  const [y, mo, d] = dateYmd.split("-").map(Number);
  const [h, min] = hm.split(":").map(Number);
  if ([y, mo, d, h, min].some((x) => Number.isNaN(x))) return null;
  const t = new Date(y, mo - 1, d, h, min, 0, 0);
  const ms = t.getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Start instant in the user's local timezone (sessionDate + startTime). */
export function bookingStartMs(booking: Pick<NextSessionPickFields, "sessionDate" | "startTime">): number | null {
  const date = (booking.sessionDate || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const hm = timeToHm(booking.startTime);
  return localWallClockMs(date, hm);
}

export function bookingEndMs(booking: NextSessionPickFields): number | null {
  const start = bookingStartMs(booking);
  if (start === null) return null;
  const endRaw = (booking.endTime || "").trim();
  if (endRaw) {
    const date = (booking.sessionDate || "").trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const hm = timeToHm(endRaw);
    const ms = localWallClockMs(date, hm);
    if (ms !== null && ms >= start) return ms;
  }
  const mins = booking.durationMinutes > 0 ? booking.durationMinutes : 30;
  return start + mins * 60_000;
}

/**
 * Next session = earliest booking whose end time is still in the future (includes in-progress).
 * Excludes terminal statuses (completed, cancelled, rejected, etc.).
 */
export function pickNextUpcomingBooking<T extends NextSessionPickFields>(bookings: T[], nowMs: number): T | null {
  const rows: { booking: T; startMs: number; endMs: number }[] = [];
  for (const booking of bookings) {
    if (isTerminalBookingStatus(booking.status)) continue;
    const startMs = bookingStartMs(booking);
    const endMs = bookingEndMs(booking);
    if (startMs === null || endMs === null) continue;
    rows.push({ booking, startMs, endMs });
  }
  const upcoming = rows.filter((r) => r.endMs >= nowMs).sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  return upcoming[0]?.booking ?? null;
}

export function formatSessionTime12h(raw: string): string {
  if (!raw) return "—";
  const normalized = raw.trim().slice(0, 8);
  const [hourText, minuteText] = normalized.slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return normalized.slice(0, 5);
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

export function formatNextSessionDateLine(sessionDate: string): string {
  if (!sessionDate) return "";
  const date = sessionDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return sessionDate;
  const [y, mo, d] = date.split("-").map(Number);
  const t = new Date(y, mo - 1, d, 12, 0, 0, 0);
  if (Number.isNaN(t.getTime())) return sessionDate;
  return t.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function formatNextSessionTimeRange(startTime: string, endTime: string): string {
  return `${formatSessionTime12h(startTime)} – ${formatSessionTime12h(endTime)}`;
}
