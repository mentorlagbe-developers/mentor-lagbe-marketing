"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit2, Eye, ExternalLink, RefreshCw, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isValidGoogleMeetUrl } from "@/lib/meet-link";
import { MentorJoinMeetingButton } from "@/app/dashboard/_components/mentor/mentor-join-meeting-button";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { canShowMentorJoinForDashboardRow, dashboardSessionToTimingRecord, formatStatus, isDashboardSessionNotEnded, statusTone, toneClasses } from "@/app/dashboard/_components/mentor/mentor-session-utils";
import { sessionStartMsFromRecord } from "@/lib/session-join-timing";
import { useNotifications } from "@/lib/notifications-context";
import { calendarDateFromApiValue, calendarDateFromRecord } from "@/lib/session-datetime";
import { sessionReadableIdFromRecord } from "@/lib/session-readable-id";

// ─── API shape ────────────────────────────────────────────────
type DashboardSession = {
  id?: string;
  readable_id?: string;
  session_date?: string;
  course_name?: string;
  custom_course_name?: string;
  topic_name?: string;
  custom_topic_name?: string;
  topicName?: string;
  customTopicName?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  startTime?: string;
  endTime?: string;
  startTime12h?: string;
  endTime12h?: string;
  duration_minutes?: number;
  student_name?: string;
  student_gender?: string;
  student_readable_id?: string;
  problem_description?: string;
  price_bdt?: string;
  meet_link?: string;
  student?: {
    name?: string;
    gender?: string;
    userId?: string;
    readable_id?: string;
    readableId?: string;
    studentReadableId?: string;
    university?: string;
    semester?: string;
  };
};

type MentorDashboardData = {
  totalSessionTime?: { hours?: number; minutes?: number; display?: string };
  totalCompletedSessions?: number;
  lastSession?: DashboardSession | null;
  pendingSessionsCount?: number;
  nextSession?: DashboardSession | null;
  upcomingSessions?: DashboardSession[];
  totalEarningsBdt?: string;
  rating?: { average?: number; count?: number };
};

// ─── Helpers ──────────────────────────────────────────────────
function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
}

/** Converts ISO timestamp or YYYY-MM-DD to "May 12, 2026" */
function friendlyDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Converts ISO datetime, "17:30", "17:30:00", or "5:30 PM" → "5:30 PM" */
function to12h(raw?: string): string {
  if (!raw?.trim()) return "—";
  const t = raw.trim();
  if (/[ap]m/i.test(t)) return t;
  if (t.includes("T")) {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
  }
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  const h = parseInt(m[1], 10);
  const min = m[2];
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${min} ${suffix}`;
}

function calendarDayFromSessionDate(sessionDate?: string): string | undefined {
  if (!sessionDate) return undefined;
  return sessionDate.includes("T") ? sessionDate.slice(0, 10) : sessionDate.slice(0, 10);
}

/** Parse session_date (YYYY-MM-DD or ISO) + clock-only time into a Date (local). */
function combineSessionDateWithClock(sessionDate: string | undefined, clock: string): Date | null {
  const day = calendarDayFromSessionDate(sessionDate);
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  if (clock.includes("T")) {
    const d = new Date(clock);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const m = clock.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  const iso = `${day}T${String(m[1]).padStart(2, "0")}:${m[2]}:${m[3] ?? "00"}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function strField(v: unknown): string {
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

function firstNonEmpty(...vals: (string | undefined)[]): string | undefined {
  for (const v of vals) {
    const t = v?.trim();
    if (t) return t;
  }
  return undefined;
}

function pickStartRaw(s: DashboardSession): string | undefined {
  const r = s as Record<string, unknown>;
  const v = firstNonEmpty(
    s.startTime12h,
    s.startTime,
    s.start_time,
    strField(r.session_start),
    strField(r.start_at),
    strField(r.slot_start),
  );
  if (v) return v;
  if (s.session_date?.includes("T")) return s.session_date;
  return undefined;
}

function pickEndRaw(s: DashboardSession): string | undefined {
  const r = s as Record<string, unknown>;
  return firstNonEmpty(
    s.endTime12h,
    s.endTime,
    s.end_time,
    strField(r.session_end),
    strField(r.end_at),
    strField(r.slot_end),
  );
}

/** Full "5:30 PM – 6:00 PM" range; fills end from duration when API omits endTime. */
function formatSessionTimeRange(s: DashboardSession): string {
  const start = pickStartRaw(s);
  let end = pickEndRaw(s);

  if (start && !end && typeof s.duration_minutes === "number" && s.duration_minutes > 0) {
    let startDt: Date | null = null;
    if (start.includes("T")) {
      startDt = new Date(start);
    } else {
      startDt = combineSessionDateWithClock(s.session_date, start);
    }
    if (startDt && !Number.isNaN(startDt.getTime())) {
      end = new Date(startDt.getTime() + s.duration_minutes * 60_000).toISOString();
    }
  }

  if (!start) return "—";
  if (!end) return to12h(start);
  return `${to12h(start)} – ${to12h(end)}`;
}

function studentReadableId(s: DashboardSession): string {
  const r = s as Record<string, unknown>;
  const st = s.student;
  const nested = firstNonEmpty(st?.readable_id, st?.readableId, st?.studentReadableId);
  const fromRoot = firstNonEmpty(s.student_readable_id, strField(r.studentReadableId));
  const sidRoot = strField(r.student_id);
  const cand = firstNonEmpty(nested, fromRoot, !isUuidLike(sidRoot) ? sidRoot : undefined) ?? "";
  if (cand && !isUuidLike(cand)) return cand;
  const uid = st?.userId?.trim();
  if (uid && isUuidLike(uid)) {
    return `STU-${uid.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  }
  return uid || "—";
}

function studentDisplayId(s: DashboardSession): string {
  const id = studentReadableId(s);
  return id && id !== "—" ? id : "—";
}

function sessionLabel(s: DashboardSession | null | undefined): string {
  if (!s) return "None";
  const date = friendlyDate(s.session_date);
  const timeRange = formatSessionTimeRange(s);
  return timeRange !== "—" ? `${date} · ${timeRange}` : date;
}

function sessionTopic(s: DashboardSession): string {
  return (
    s.custom_topic_name?.trim() ||
    s.customTopicName?.trim() ||
    s.topic_name?.trim() ||
    s.topicName?.trim() ||
    "—"
  );
}

// ─── Gender badge ─────────────────────────────────────────────
function GenderBadge({ gender }: { gender?: string }) {
  if (!gender) return null;
  const label = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  const cls =
    gender.toLowerCase() === "male"
      ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40"
      : gender.toLowerCase() === "female"
        ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800/40"
        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cls)}>
      {label}
    </span>
  );
}

// ─── View Session Detail Modal ────────────────────────────────
function SessionDetailModal({ session, onClose }: { session: DashboardSession; onClose: () => void }) {
  const sName = session.student?.name ?? session.student_name ?? "—";
  const sGender = session.student?.gender ?? session.student_gender ?? "";
  const sReadableId = studentReadableId(session);
  const sUniversity = session.student?.university ?? "";
  const sSemester = session.student?.semester ?? "";
  const time = formatSessionTimeRange(session);

  return (
    <Modal open onClose={onClose} className="w-full max-w-xl">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session Details</h2>
          <p className="mt-1 font-mono text-xs text-slate-400">ID: {session.readable_id ?? "—"}</p>
        </div>
        {/* Student card */}
        <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 dark:border-sky-800/40 dark:bg-sky-950/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/50">
            <User className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{sName}</p>
              <GenderBadge gender={sGender} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Student ID: <span className="font-mono font-medium">{sReadableId}</span>
            </p>
            {(sUniversity || sSemester) && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {[sUniversity, sSemester].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Session info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Topic", value: sessionTopic(session) },
            { label: "Date", value: friendlyDate(session.session_date) },
            { label: "Time", value: time },
            { label: "Duration", value: session.duration_minutes ? `${session.duration_minutes} min` : "—" },
            { label: "Status", value: (session.status ?? "unknown").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || "—"}</p>
            </div>
          ))}
        </div>

        {/* Problem description */}
        {session.problem_description && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Problem</p>
            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{session.problem_description}</p>
          </div>
        )}

        {/* Meet link — never show raw URL */}
        {session.meet_link?.trim() && canShowMentorJoinForDashboardRow(session) ? (
          <MentorJoinMeetingButton session={session} variant="full" />
        ) : null}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Meet Link Modal ─────────────────────────────────────
function EditMeetLinkModal({
  session,
  onClose,
  onSaved,
}: {
  session: DashboardSession;
  onClose: () => void;
  onSaved: (id: string, link: string) => void;
}) {
  const [link, setLink] = useState(session.meet_link ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!link.trim()) {
      setError("Please enter a valid Google Meet link.");
      return;
    }
    if (!isValidGoogleMeetUrl(link)) {
      setError("Enter a complete Google Meet link (e.g. meet.google.com/xxx-yyy-zzz).");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const sid = encodeURIComponent(session.id ?? "");
      await apiFetch(`/live-sessions/sessions/${sid}/meet-link`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({ meetLink: link.trim() }),
      });
      onSaved(session.id ?? "", link.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update meet link.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} className="w-full max-w-md">
      <div className="space-y-4 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Update Meet Link</h2>
        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 dark:border-sky-800/40 dark:bg-sky-950/30">
          <p className="font-semibold text-sky-800 dark:text-sky-300">{sessionTopic(session)}</p>
          <p className="mt-0.5 text-xs text-sky-600 dark:text-sky-400">
            {friendlyDate(session.session_date)} · {formatSessionTimeRange(session)}
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Google Meet Link <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <ExternalLink className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setError(null);
              }}
              placeholder="https://meet.google.com/..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-sky-500"
            />
          </div>
          {error ? (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </p>
          ) : null}
          <p className="mt-1.5 text-xs text-slate-400">The student will receive the updated link instantly.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || !isValidGoogleMeetUrl(link)}>
            {isSaving ? "Saving…" : "Save Link"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Component ────────────────────────────────────────────────
export function MentorDashboardOverview() {
  const { sessionAcceptedAt, sessionRefreshAt } = useNotifications();
  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [extraSessions, setExtraSessions] = useState<DashboardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewSession, setViewSession] = useState<DashboardSession | null>(null);
  const [editSession, setEditSession] = useState<DashboardSession | null>(null);
  const [meetLinkOverrides, setMeetLinkOverrides] = useState<Record<string, string>>({});

  function normalizeSessions(raw: unknown): DashboardSession[] {
    let list: DashboardSession[] = [];
    if (Array.isArray(raw)) list = raw as DashboardSession[];
    else {
      const r = raw as Record<string, unknown>;
      for (const key of ["items", "data", "sessions", "results", "requests"]) {
        if (Array.isArray(r?.[key])) {
          list = r[key] as DashboardSession[];
          break;
        }
      }
    }
    return list.map((s) => {
      const rec = s as unknown as Record<string, unknown>;
      const ymd =
        calendarDateFromRecord(rec) || calendarDateFromApiValue(s.session_date);
      const readable_id = sessionReadableIdFromRecord(rec);
      return {
        ...s,
        ...(ymd ? { session_date: ymd } : {}),
        ...(readable_id !== "—" ? { readable_id } : {}),
      };
    });
  }

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      // Primary: dashboard summary (has upcomingSessions already)
      // Secondary: all mentor sessions (no status filter — avoids 400 from invalid enum)
      const [dashResult, allResult] = await Promise.allSettled([
        apiFetch<MentorDashboardData>("/live-sessions/mentor/dashboard", { auth: true }),
        apiFetch<unknown>("/live-sessions/mentor/sessions", { auth: true }),
      ]);

      if (dashResult.status === "fulfilled") {
        setData(dashResult.value);
      } else {
        setError(dashResult.reason instanceof Error ? dashResult.reason.message : "Failed to load dashboard data.");
      }

      if (allResult.status === "fulfilled") {
        const list = normalizeSessions(allResult.value).filter((s) => isDashboardSessionNotEnded(s));
        setExtraSessions(list);
      }
      // If allResult fails we still have upcomingSessions from the dashboard — no error needed
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        load().catch(() => setIsLoading(false));
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (sessionAcceptedAt === 0 && sessionRefreshAt === 0) return;
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionAcceptedAt, sessionRefreshAt]);

  // Merge upcomingSessions (from dashboard summary) with extra sessions, deduplicate by id
  const upcoming = useMemo(() => {
    const base = (data?.upcomingSessions ?? []).filter((s) => isDashboardSessionNotEnded(s));
    const merged = [...base];
    for (const s of extraSessions) {
      if (s.id && !merged.some((x) => x.id === s.id)) {
        merged.push(s);
      }
    }
    return merged
      .map((s) => {
        const id = s.id ?? "";
        const override = id ? meetLinkOverrides[id] : undefined;
        return override ? { ...s, meet_link: override } : s;
      })
      .filter((s) => isDashboardSessionNotEnded(s))
      .sort((a, b) => {
        const aRec = dashboardSessionToTimingRecord(a);
        const bRec = dashboardSessionToTimingRecord(b);
        const aMs = sessionStartMsFromRecord(aRec) ?? 0;
        const bMs = sessionStartMsFromRecord(bRec) ?? 0;
        return aMs - bMs;
      });
  }, [data, extraSessions, meetLinkOverrides]);

  // ── Quick stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!data) {
      return [
        { label: "Total Session Hours", value: "—", trend: "Across all completed sessions" },
        { label: "Last Session", value: "—", trend: "Most recent completed" },
        { label: "Pending Sessions", value: "—", trend: "Awaiting your action" },
        { label: "Next Session", value: "—", trend: "Upcoming confirmed session" },
      ];
    }
    const nextUpcoming = upcoming[0] ?? null;
    return [
      {
        label: "Total Session Hours",
        value: data.totalSessionTime?.display ?? `${data.totalSessionTime?.hours ?? 0}h ${data.totalSessionTime?.minutes ?? 0}m`,
        trend: `${data.totalCompletedSessions ?? 0} sessions completed`,
      },
      {
        label: "Last Session",
        value: sessionLabel(data.lastSession),
        trend: data.lastSession ? sessionTopic(data.lastSession) : "No sessions yet",
      },
      {
        label: "Pending Sessions",
        value: String(data.pendingSessionsCount ?? 0),
        trend: "Awaiting your action",
      },
      {
        label: "Next Session",
        value: nextUpcoming ? sessionLabel(nextUpcoming) : "Nothing scheduled",
        trend: nextUpcoming ? sessionTopic(nextUpcoming) : "Accept requests to schedule sessions",
      },
    ];
  }, [data, upcoming]);

  function handleMeetLinkSaved(id: string, link: string) {
    setMeetLinkOverrides((prev) => ({ ...prev, [id]: link }));
  }

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      {/* Modals */}
      {viewSession && (
        <SessionDetailModal session={viewSession} onClose={() => setViewSession(null)} />
      )}
      {editSession ? (
        <EditMeetLinkModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onSaved={handleMeetLinkSaved}
        />
      ) : null}

      {/* Upcoming sessions table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Upcoming Sessions
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Accepted &amp; scheduled sessions yet to be conducted
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm font-medium text-rose-500">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="text-xs text-sky-600 underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No upcoming sessions</p>
            <p className="text-xs text-slate-400">Sessions starting from now will appear here after you accept requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Student ID</th>
                  <th className="px-4 py-2.5">Topic</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th
                    className="px-4 py-2.5"
                    title="Open Google Meet when the session starts (enabled at start time)"
                  >
                    Join meeting
                  </th>
                  <th className="px-4 py-2.5 whitespace-nowrap">Status</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((s, i) => (
                  <tr
                    key={s.id ?? i}
                    className="border-b border-slate-100 transition hover:bg-sky-50/40 dark:border-slate-700/60 dark:hover:bg-sky-950/20"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                      {s.readable_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {studentDisplayId(s)}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-slate-600 dark:text-slate-400">
                      <p className="truncate font-medium text-slate-800 dark:text-slate-100" title={sessionTopic(s)}>
                        {sessionTopic(s)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {friendlyDate(s.session_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatSessionTimeRange(s)}
                    </td>
                    <td className="px-4 py-3">
                      {canShowMentorJoinForDashboardRow(s) && s.id ? (
                        <MentorJoinMeetingButton session={s} variant="compact" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize",
                          toneClasses(statusTone(s.status ?? "")),
                        )}
                      >
                        {formatStatus(s.status ?? "unknown")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* View details */}
                        <button
                          type="button"
                          onClick={() => setViewSession(s)}
                          title="View session details"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-sky-600 dark:hover:bg-sky-950/40 dark:hover:text-sky-400"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSession(s)}
                          title="Update meet link"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-violet-600 dark:hover:bg-violet-950/40 dark:hover:text-violet-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
