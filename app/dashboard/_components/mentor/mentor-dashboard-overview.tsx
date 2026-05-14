"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit2, Eye, ExternalLink, RefreshCw, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isValidGoogleMeetUrl } from "@/lib/meet-link";
import { JoinMeetingButton } from "@/app/components/ui/join-meeting-button";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

// ─── API shape ────────────────────────────────────────────────
type DashboardSession = {
  id?: string;
  readable_id?: string;
  session_date?: string;
  course_name?: string;
  custom_course_name?: string;
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
  let start = pickStartRaw(s);
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

function sessionLabel(s: DashboardSession | null | undefined): string {
  if (!s) return "None";
  const date = friendlyDate(s.session_date);
  const timeRange = formatSessionTimeRange(s);
  return timeRange !== "—" ? `${date} · ${timeRange}` : date;
}

function sessionTopic(s: DashboardSession): string {
  return s.custom_course_name ?? s.course_name ?? "—";
}

function studentName(s: DashboardSession): string {
  return s.student?.name ?? s.student_name ?? "—";
}

function safeId(s: DashboardSession): string {
  return s.readable_id ?? s.id?.slice(0, 8) ?? "—";
}

// Status is "not yet conducted" = accepted/scheduled/confirmed but not completed/canceled
function isNotYetConducted(status = ""): boolean {
  const s = status.toLowerCase();
  return (
    s.includes("accepted") ||
    s.includes("mentor_accepted") ||
    s.includes("scheduled") ||
    s.includes("confirmed") ||
    s.includes("pending")
  ) && !s.includes("completed") && !s.includes("cancel") && !s.includes("expired");
}

function statusTone(status = ""): "success" | "warning" | "danger" | "info" {
  const s = status.toLowerCase();
  if (s.includes("completed")) return "success";
  if (s.includes("pending") || s.includes("scheduled") || s.includes("accepted")) return "warning";
  if (s.includes("cancel") || s.includes("declined") || s.includes("expired")) return "danger";
  return "info";
}

const toneMap: Record<"success" | "warning" | "danger" | "info", string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/25 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/25 dark:text-amber-300",
  danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/25 dark:text-rose-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/40 dark:bg-sky-900/25 dark:text-sky-300",
};

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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session Details</h2>
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
            { label: "Session ID", value: safeId(session) },
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
        {session.meet_link?.trim() ? (
          <JoinMeetingButton href={session.meet_link} variant="full" />
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
    if (!link.trim()) { setError("Please enter a valid Google Meet link."); return; }
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
      <div className="p-6 space-y-4">
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
              onChange={e => { setLink(e.target.value); setError(null); }}
              placeholder="https://meet.google.com/..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-sky-500"
            />
          </div>
          {error && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">{error}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-400">The student will receive the updated link instantly.</p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancel</Button>
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
  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [extraSessions, setExtraSessions] = useState<DashboardSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewSession, setViewSession] = useState<DashboardSession | null>(null);
  const [editSession, setEditSession] = useState<DashboardSession | null>(null);

  function normalizeSessions(raw: unknown): DashboardSession[] {
    if (Array.isArray(raw)) return raw as DashboardSession[];
    const r = raw as Record<string, unknown>;
    for (const key of ["items", "data", "sessions", "results", "requests"]) {
      if (Array.isArray(r?.[key])) return r[key] as DashboardSession[];
    }
    return [];
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
        const list = normalizeSessions(allResult.value).filter(s => isNotYetConducted(s.status));
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
        value: sessionLabel(data.nextSession),
        trend: data.nextSession ? sessionTopic(data.nextSession) : "Nothing scheduled",
      },
    ];
  }, [data]);

  // Merge upcomingSessions (from dashboard summary) with extra sessions, deduplicate by id
  const [upcoming, setUpcoming] = useState<DashboardSession[]>([]);

  const computedUpcoming = useMemo(() => {
    const base = data?.upcomingSessions ?? [];
    const merged = [...base];
    for (const s of extraSessions) {
      if (s.id && !merged.some(x => x.id === s.id)) {
        merged.push(s);
      }
    }
    return merged
      .filter(s => isNotYetConducted(s.status))
      .sort((a, b) => {
        const da = new Date(a.session_date ?? "").getTime() || 0;
        const db = new Date(b.session_date ?? "").getTime() || 0;
        return da - db;
      });
  }, [data, extraSessions]);

  useEffect(() => { setUpcoming(computedUpcoming); }, [computedUpcoming]);

  function handleMeetLinkSaved(id: string, link: string) {
    setUpcoming(prev => prev.map(s => s.id === id ? { ...s, meet_link: link } : s));
  }

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      {/* Modals */}
      {viewSession && (
        <SessionDetailModal session={viewSession} onClose={() => setViewSession(null)} />
      )}
      {editSession && (
        <EditMeetLinkModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onSaved={handleMeetLinkSaved}
        />
      )}

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
            <p className="text-xs text-slate-400">Accept session requests and they will appear here.</p>
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
                  <th className="px-4 py-2.5">Meet Link</th>
                  <th className="px-4 py-2.5">Status</th>
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
                      {safeId(s)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      {studentName(s)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {sessionTopic(s)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {friendlyDate(s.session_date)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatSessionTimeRange(s)}
                    </td>
                    <td className="px-4 py-3">
                      {s.meet_link?.trim() ? (
                        <JoinMeetingButton href={s.meet_link} variant="compact" />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", toneMap[statusTone(s.status)])}>
                        {(s.status ?? "unknown").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
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
                        {/* Edit meet link */}
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
