"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Eye, History, RefreshCw, Video } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { MentorJoinMeetingButton } from "@/app/dashboard/_components/mentor/mentor-join-meeting-button";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notifications-context";
import {
  fetchMentorSessions,
  formatStatus,
  formatTime,
  isUpcomingLiveSession,
  matchesMentorHistoryFilter,
  type MentorHistoryFilter,
  type MentorSession,
  statusTone,
  toneClasses,
} from "@/app/dashboard/_components/mentor/mentor-session-utils";

type MentorDashboardSummary = {
  lastSession?: {
    session_date?: string;
    sessionDate?: string;
    startTime12h?: string;
    start_time?: string;
    course_name?: string;
    custom_course_name?: string;
    status?: string;
  } | null;
  nextSession?: {
    session_date?: string;
    sessionDate?: string;
    startTime12h?: string;
    start_time?: string;
    course_name?: string;
    custom_course_name?: string;
    status?: string;
    meet_link?: string;
    id?: string;
  } | null;
};

const HISTORY_FILTERS: { value: MentorHistoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "canceled", label: "Canceled" },
];

function friendlyDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function topicFromRow(row: { topicName?: string; customTopicName?: string }): string {
  return row.customTopicName?.trim() || row.topicName?.trim() || "—";
}

function sessionCardLabel(
  row: MentorDashboardSummary["lastSession"] | MentorDashboardSummary["nextSession"],
): string {
  if (!row) return "None";
  const date = friendlyDate(row.session_date ?? row.sessionDate);
  const time = row.startTime12h ?? (row.start_time ? formatTime(row.start_time) : "");
  return time ? `${date} · ${time}` : date;
}

function SessionDetailModal({ session, onClose }: { session: MentorSession; onClose: () => void }) {
  const topic = topicFromRow(session);
  const time =
    session.startTime && session.endTime
      ? `${formatTime(session.startTime)} – ${formatTime(session.endTime)}`
      : session.startTime
        ? formatTime(session.startTime)
        : "—";

  return (
    <Modal open onClose={onClose} className="w-full max-w-xl">
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session Details</h2>
          <p className="mt-1 font-mono text-xs text-slate-400">ID: {session.readableId}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Student", value: session.studentName || "—" },
            { label: "Topic", value: topic },
            { label: "Date", value: friendlyDate(session.sessionDate) },
            { label: "Time", value: time },
            { label: "Status", value: formatStatus(session.status) },
            { label: "Price", value: session.priceBdt ? `৳${session.priceBdt}` : "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || "—"}</p>
            </div>
          ))}
        </div>
        {session.meetLink?.trim() ? (
          <MentorJoinMeetingButton session={session} variant="full" />
        ) : null}
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function MentorLiveSessionsPanel() {
  const { sessionAcceptedAt, sessionRefreshAt } = useNotifications();
  const [summary, setSummary] = useState<MentorDashboardSummary | null>(null);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [historyFilter, setHistoryFilter] = useState<MentorHistoryFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewSession, setViewSession] = useState<MentorSession | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dashResult, sessionsResult] = await Promise.allSettled([
        apiFetch<MentorDashboardSummary>("/live-sessions/mentor/dashboard", { auth: true }),
        fetchMentorSessions(apiFetch),
      ]);

      if (dashResult.status === "fulfilled") {
        setSummary(dashResult.value);
      } else {
        setError(
          dashResult.reason instanceof Error ? dashResult.reason.message : "Failed to load live sessions.",
        );
      }

      if (sessionsResult.status === "fulfilled") {
        setSessions(sessionsResult.value);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        void load();
      });
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  useEffect(() => {
    if (sessionAcceptedAt === 0 && sessionRefreshAt === 0) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [sessionAcceptedAt, sessionRefreshAt, load]);

  const upcomingFromList = useMemo(
    () =>
      sessions
        .filter((s) => isUpcomingLiveSession(s.status))
        .sort((a, b) => {
          const da = new Date(a.sessionDate).getTime() || 0;
          const db = new Date(b.sessionDate).getTime() || 0;
          return da - db;
        }),
    [sessions],
  );

  const nextCard = useMemo(() => {
    if (summary?.nextSession) {
      return {
        label: sessionCardLabel(summary.nextSession),
        trend: summary.nextSession.custom_course_name ?? summary.nextSession.course_name ?? "Next confirmed session",
      };
    }
    const first = upcomingFromList[0];
    if (!first) return { label: "None scheduled", trend: "Accept requests to schedule sessions" };
    const time = first.startTime ? formatTime(first.startTime) : "";
    return {
      label: `${friendlyDate(first.sessionDate)}${time ? ` · ${time}` : ""}`,
      trend: topicFromRow(first),
    };
  }, [summary, upcomingFromList]);

  const lastCard = useMemo(() => {
    if (summary?.lastSession) {
      return {
        label: sessionCardLabel(summary.lastSession),
        trend: summary.lastSession.custom_course_name ?? summary.lastSession.course_name ?? "Most recent completed",
      };
    }
    const completed = sessions
      .filter((s) => s.status.toLowerCase().includes("completed"))
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
    const last = completed[0];
    if (!last) return { label: "No sessions yet", trend: "Completed sessions appear here" };
    return {
      label: `${friendlyDate(last.sessionDate)}${last.startTime ? ` · ${formatTime(last.startTime)}` : ""}`,
      trend: topicFromRow(last),
    };
  }, [summary, sessions]);

  const quickStats = useMemo(
    () => [
      { label: "Last Session", value: lastCard.label, trend: lastCard.trend },
      { label: "Upcoming Session", value: nextCard.label, trend: nextCard.trend },
    ],
    [lastCard, nextCard],
  );

  const filteredHistory = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      const da = new Date(a.sessionDate).getTime() || 0;
      const db = new Date(b.sessionDate).getTime() || 0;
      return db - da;
    });
    return sorted.filter((s) => matchesMentorHistoryFilter(s.status, historyFilter));
  }, [sessions, historyFilter]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Live Sessions</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Your session timeline, upcoming meetings, and full history
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:text-brand-primary disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {quickStats.map((item, idx) => (
          <article
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-sky-950/20"
          >
            <div className="flex items-center gap-2">
              {idx === 0 ? (
                <History className="h-4 w-4 text-brand-primary" />
              ) : (
                <Video className="h-4 w-4 text-brand-primary" />
              )}
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            </div>
            <p className="mt-3 text-lg font-bold leading-snug text-slate-900 dark:text-slate-100">{item.value}</p>
            <p className="mt-1 text-xs text-brand-primary">{item.trend}</p>
          </article>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Session History</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {filteredHistory.length} session{filteredHistory.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
            {HISTORY_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setHistoryFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  historyFilter === f.value
                    ? "bg-white text-brand-primary shadow-sm dark:bg-slate-700"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No sessions in this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Topic</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Join</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((s) => {
                  const tone = statusTone(s.status);
                  const time =
                    s.startTime && s.endTime
                      ? `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`
                      : s.startTime
                        ? formatTime(s.startTime)
                        : "—";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 transition hover:bg-sky-50/40 dark:border-slate-700/60 dark:hover:bg-sky-950/20"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        {s.readableId}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {s.studentName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{topicFromRow(s)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {friendlyDate(s.sessionDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{time}</td>
                      <td className="px-4 py-3">
                        {s.meetLink?.trim() && isUpcomingLiveSession(s.status) ? (
                          <MentorJoinMeetingButton session={s} variant="compact" />
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                            toneClasses(tone),
                          )}
                        >
                          {formatStatus(s.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewSession(s)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-sky-300 hover:text-brand-primary dark:border-slate-700 dark:text-slate-400"
                          aria-label="View session"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewSession ? <SessionDetailModal session={viewSession} onClose={() => setViewSession(null)} /> : null}
    </section>
  );
}
