"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { BookingDetailPanel } from "@/app/dashboard/_components/bookings/booking-detail-panel";
import { useNotifications } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";
import { Pagination } from "@/app/components/ui/pagination";
import {
  formatNextSessionDateLine,
  formatNextSessionTimeRange,
  pickNextUpcomingBooking,
} from "@/app/dashboard/_components/student/student-session-utils";

type BookingRecord = {
  id: string;
  readableId: string;
  status: string;
  departmentId?: string | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceBdt: string;
  courseId?: string | null;
  topicId?: string | null;
  customTopicName?: string | null;
  problemDescription?: string | null;
  mentorId?: string | null;
  mentorReadableId?: string | null;
  meetLink?: string | null;
  meetLinkActive?: boolean;
  broadcastCount?: number;
  mentorAcceptedAt?: string | null;
  isFreeTrial?: boolean;
  createdAt?: string;
};

const PAGE_SIZE = 6;

function isUuidLike(value: string) {
  const normalized = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized) ||
    /^[0-9a-f]{32}$/i.test(normalized)
  );
}

function getReadableSessionId(record: Record<string, unknown>) {
  const candidates = [
    record.readableId,
    record.sessionReadableId,
    record.bookingReadableId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() && !isUuidLike(candidate.trim())) {
      return candidate.trim();
    }
  }
  return "N/A";
}

function toBookingRecord(record: Record<string, unknown>): BookingRecord {
  const getString = (key: string, fallback = "") => {
    const value = record[key];
    return typeof value === "string" ? value : fallback;
  };
  const getNumber = (key: string, fallback = 0) => {
    const value = record[key];
    return typeof value === "number" ? value : fallback;
  };

  return {
    id: getString("id", crypto.randomUUID()),
    readableId: getReadableSessionId(record),
    status: getString("status", "unknown"),
    departmentId: getString("departmentId", ""),
    sessionDate: getString("sessionDate", ""),
    startTime: getString("startTime", ""),
    endTime: getString("endTime", ""),
    durationMinutes: getNumber("durationMinutes", 0),
    priceBdt: getString("priceBdt", "0"),
    courseId: getString("courseId", ""),
    topicId: getString("topicId", ""),
    customTopicName: getString("customTopicName", ""),
    problemDescription: getString("problemDescription", ""),
    mentorId: getString("mentorId", ""),
    mentorReadableId: getString("mentorReadableId", "") || getString("mentorProfile.readableId", "") ||
      (() => {
        const mp = record.mentor ?? record.mentorProfile ?? record.mentorInfo;
        if (mp && typeof mp === "object") {
          const m = mp as Record<string, unknown>;
          return typeof m.readableId === "string" ? m.readableId :
                 typeof m.mentorReadableId === "string" ? m.mentorReadableId : "";
        }
        return "";
      })(),
    meetLink: getString("meetLink", "") || getString("meet_link", ""),
    meetLinkActive: Boolean(record.meetLinkActive),
    broadcastCount: getNumber("broadcastCount", 0),
    mentorAcceptedAt: getString("mentorAcceptedAt", ""),
    isFreeTrial: Boolean(record.isFreeTrial),
    createdAt: getString("createdAt", ""),
  };
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("completed") ||
    normalized.includes("confirmed") ||
    normalized.includes("accepted") ||
    normalized.includes("active")
  ) {
    return "success";
  }
  if (
    normalized.includes("pending") ||
    normalized.includes("waiting") ||
    normalized.includes("rescheduled")
  ) {
    return "warning";
  }
  if (
    normalized.includes("cancel") ||
    normalized.includes("failed") ||
    normalized.includes("rejected") ||
    normalized.includes("expired")
  ) {
    return "danger";
  }
  return "info";
}

function badgeToneClass(tone: "success" | "warning" | "danger" | "info") {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300";
  if (tone === "danger") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/50 dark:bg-rose-900/30 dark:text-rose-300";
  return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700/50 dark:bg-sky-900/30 dark:text-sky-300";
}

function formatTime(raw: string) {
  if (!raw) return "-";
  const normalized = raw.slice(0, 5);
  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return normalized;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function daysAgo(dateString?: string) {
  if (!dateString) return "N/A";
  const value = new Date(dateString).getTime();
  if (Number.isNaN(value)) return "N/A";
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - value) / (1000 * 60 * 60 * 24)));
  return `${diff} day${diff === 1 ? "" : "s"} ago`;
}

export function BookingsSection() {
  const searchParams = useSearchParams();
  const { sessionAcceptedAt, sessionRefreshAt } = useNotifications();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BookingRecord | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [courseNames, setCourseNames] = useState<Record<string, string>>({});
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const hydrateSubjectNames = useCallback(async (items: BookingRecord[]) => {
    try {
      const departmentIds = Array.from(new Set(items.map((item) => item.departmentId).filter(Boolean))) as string[];
      const nextCourseNames: Record<string, string> = {};
      const nextTopicNames: Record<string, string> = {};

      for (const departmentId of departmentIds) {
        const courses = await apiFetch<Array<Record<string, unknown>>>(
          `/courses?departmentId=${encodeURIComponent(departmentId)}`,
          { auth: true }
        );
        for (const course of courses) {
          const courseId = typeof course.id === "string" ? course.id : "";
          const courseName =
            typeof course.name === "string"
              ? course.name
              : typeof course.title === "string"
                ? course.title
                : typeof course.label === "string"
                  ? course.label
                  : "";
          if (courseId && courseName) nextCourseNames[courseId] = courseName;
        }
      }

      const courseIds = Array.from(new Set(items.map((item) => item.courseId).filter(Boolean))) as string[];
      for (const courseId of courseIds) {
        const topics = await apiFetch<Array<Record<string, unknown>>>(
          `/topics?courseId=${encodeURIComponent(courseId)}`,
          { auth: true }
        );
        for (const topic of topics) {
          const topicId = typeof topic.id === "string" ? topic.id : "";
          const topicName =
            typeof topic.name === "string"
              ? topic.name
              : typeof topic.title === "string"
                ? topic.title
                : typeof topic.label === "string"
                  ? topic.label
                  : "";
          if (topicId && topicName) nextTopicNames[topicId] = topicName;
        }
      }

      setCourseNames(nextCourseNames);
      setTopicNames(nextTopicNames);
    } catch {
      setCourseNames({});
      setTopicNames({});
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await apiFetch<unknown>("/live-sessions/bookings/me", { auth: true });
      let records: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        records = data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
      } else if (data && typeof data === "object") {
        const source = data as Record<string, unknown>;
        const maybeItems = source.items ?? source.records ?? source.bookings ?? source.data;
        if (Array.isArray(maybeItems)) {
          records = maybeItems.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
        } else {
          records = [source];
        }
      }
      const normalized = records.map(toBookingRecord).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setBookings(normalized);
      setPage(1);
      await hydrateSubjectNames(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  }, [hydrateSubjectNames]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBookings();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (!focus) return;
    void handleViewDetails(focus);
  }, [searchParams]);

  useEffect(() => {
    if (sessionAcceptedAt === 0 && sessionRefreshAt === 0) return;
    const selectedId = selected?.id;
    const timer = window.setTimeout(() => {
      void loadBookings();
      if (selectedId) {
        void handleViewDetails(selectedId);
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionAcceptedAt, sessionRefreshAt]);

  const getSubjectLabel = useCallback((booking: BookingRecord) => {
    return (
      booking.customTopicName ||
      (booking.topicId ? topicNames[booking.topicId] : "") ||
      (booking.courseId ? courseNames[booking.courseId] : "") ||
      "N/A"
    );
  }, [courseNames, topicNames]);

  async function handleViewDetails(bookingId: string) {
    setDetailsError(null);
    setIsLoadingDetails(true);
    try {
      const details = await apiFetch<Record<string, unknown>>(
        `/live-sessions/bookings/me/${encodeURIComponent(bookingId)}`,
        { auth: true }
      );
      setSelected(toBookingRecord(details));
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load booking details.");
      setSelected(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(bookings.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pagedBookings = bookings.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  const insights = useMemo(() => {
    const totalMinutes = bookings.reduce((sum, booking) => sum + booking.durationMinutes, 0);
    const averageDuration = bookings.length ? Math.round(totalMinutes / bookings.length) : 0;
    const subjectCount = new Map<string, number>();
    for (const booking of bookings) {
      const subject = getSubjectLabel(booking);
      subjectCount.set(subject, (subjectCount.get(subject) ?? 0) + 1);
    }
    const mostStudied = [...subjectCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
    const lastBooking = bookings[0];
    const statusSummary = bookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] ?? 0) + 1;
      return acc;
    }, {});
    const pendingMentorCount = bookings.filter((booking) => !booking.mentorId).length;
    const meetingReadyCount = bookings.filter((booking) => booking.meetLinkActive).length;
    const nextSession = pickNextUpcomingBooking(bookings, nowMs);
    return {
      totalMinutes,
      averageDuration,
      mostStudied,
      lastBookingLabel: lastBooking ? daysAgo(lastBooking.createdAt) : "N/A",
      statusSummary,
      pendingMentorCount,
      meetingReadyCount,
      nextSession,
    };
  }, [bookings, getSubjectLabel, nowMs]);

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Total Study Time Spent</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{Math.floor(insights.totalMinutes / 60)}h {insights.totalMinutes % 60}m</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Average Session Duration</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{insights.averageDuration} min</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Recently Studied Subject</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{insights.mostStudied}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Last Booking</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{insights.lastBookingLabel}</p>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Mentor Assignment</h3>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{insights.pendingMentorCount}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sessions waiting for mentor acceptance.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Meeting Ready</h3>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{insights.meetingReadyCount}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Bookings with active meeting links.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Next Session</h3>
          {isLoading ? (
            <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">Loading…</p>
          ) : insights.nextSession ? (
            <>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                {formatNextSessionDateLine(insights.nextSession.sessionDate)}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {formatNextSessionTimeRange(insights.nextSession.startTime, insights.nextSession.endTime)}
              </p>
              <p className="mt-2 text-sm font-medium text-sky-600 dark:text-sky-400">Upcoming session</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-base font-semibold text-slate-700 dark:text-slate-300">no session found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Book a live session to see it here.</p>
            </>
          )}
        </article>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Booking Session History</h3>
            <Button size="sm" variant="secondary" iconLeft={RefreshCw} onClick={() => void loadBookings()}>
              Refresh
            </Button>
          </div>
          {isLoading ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading booking history...</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
          {!isLoading && !error ? (
            <>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-400">
                      <th className="px-3 py-2">Session ID</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-slate-100 transition hover:bg-sky-50/50 dark:border-slate-700 dark:hover:bg-sky-950/30">
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{booking.readableId}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{booking.sessionDate || "-"}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{booking.durationMinutes} min</td>
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">৳{booking.priceBdt}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-xs font-semibold",
                              badgeToneClass(getStatusTone(booking.status))
                            )}
                          >
                            {formatStatus(booking.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => void handleViewDetails(booking.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-sky-200 p-2 text-sky-600 transition hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/50"
                            aria-label="View booking details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!pagedBookings.length ? (
                      <tr>
                        <td className="px-3 py-5 text-center text-slate-500 dark:text-slate-400" colSpan={7}>No bookings found yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 px-1">
                <Pagination
                  page={clampedPage}
                  totalPages={totalPages}
                  totalItems={bookings.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            </>
          ) : null}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Learning Insights</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(insights.statusSummary).map(([status, count]) => (
              <div
                key={status}
                className={cn(
                  "rounded-xl border px-3 py-2",
                  badgeToneClass(getStatusTone(status))
                )}
              >
                <p className="text-xs uppercase text-slate-400 dark:text-slate-500">{formatStatus(status)}</p>
                <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{count}</p>
              </div>
            ))}
            {!Object.keys(insights.statusSummary).length ? (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-400">No status insights yet.</div>
            ) : null}
          </div>
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
            Keep booking consistently to improve mentor matching and faster topic coverage.
          </div>
      </article>

      <Modal open={Boolean(selected) || isLoadingDetails || Boolean(detailsError)} onClose={() => {
        setSelected(null);
        setDetailsError(null);
      }} className="mx-auto h-auto max-w-3xl rounded-3xl">
        <div className="w-full bg-linear-to-br from-white to-sky-50/40 p-6 dark:from-slate-800 dark:to-slate-900">
          <h4 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Session Details</h4>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Payment, join access, and session info for this booking.
          </p>
          {isLoadingDetails ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading details...</p> : null}
          {detailsError ? <p className="mt-3 text-sm text-rose-500">{detailsError}</p> : null}
          {selected ? (
            <BookingDetailPanel
              className="mt-4"
              bookingId={selected.id}
              topicLabel={getSubjectLabel(selected)}
              onClose={() => {
                setSelected(null);
                setDetailsError(null);
              }}
              onUpdated={() => {
                void loadBookings();
              }}
            />
          ) : null}
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={() => {
              setSelected(null);
              setDetailsError(null);
            }}>Close</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

