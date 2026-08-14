"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  GraduationCap,
  MoreHorizontal,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { isValidGoogleMeetUrl } from "@/lib/meet-link";
import { useNotifications } from "@/lib/notifications-context";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Modal } from "@/app/components/ui/modal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import {
  calendarDateFromApiValue,
  calendarDateFromRecord,
  matchesDayFilter,
  type DayFilterKey,
} from "@/lib/session-datetime";
import { sessionReadableIdFromRecord } from "@/lib/session-readable-id";

type DayFilter = DayFilterKey;
type SessionRequest = {
  id: string;           // broadcast / request row id
  session_id?: string;  // the actual session UUID — needed for accept/decline
  readable_id?: string;
  status: string;
  session_date?: string;
  startTime12h?: string;
  endTime12h?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  price_bdt?: string;
  course_name?: string;
  custom_course_name?: string;
  problem_description?: string;
  notified_at?: string;
  batch_number?: number;
  student_name?: string;
  student_gender?: string;
  student_readable_id?: string;
  student?: {
    userId?: string;
    readableId?: string;
    name?: string;
    gender?: string;
    university?: string;
    semester?: string;
  };
};

type TodayRequestsResponse = unknown;

type DashboardSummary = {
  pendingSessionsCount?: number;
  nextSession?: { session_date?: string; startTime12h?: string; course_name?: string } | null;
  totalCompletedSessions?: number;
};

// ─── Helpers ──────────────────────────────────────────────────

/** Returns the session UUID to use in /sessions/:id/accept|decline */
function sessionUuid(s: SessionRequest): string {
  return s.session_id ?? s.id;
}

/** Converts any date string (ISO timestamp or YYYY-MM-DD) to "May 12, 2026" */
function friendlyDate(raw?: string): string {
  if (!raw) return "TBD";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function topic(s: SessionRequest): string {
  return s.custom_course_name ?? s.course_name ?? "—";
}

function studentName(s: SessionRequest): string {
  return s.student?.name ?? s.student_name ?? "Unknown";
}

function studentGender(s: SessionRequest): string {
  return s.student?.gender ?? s.student_gender ?? "";
}

function studentReadableId(s: SessionRequest): string {
  return (
    s.student?.readableId ??
    s.student_readable_id ??
    ""
  ).trim();
}

function pickStudentField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const direct = row[key];
    if (typeof direct === "string" && direct.trim()) return direct.trim();
  }
  const nested = row.student ?? row.studentProfile ?? row.studentInfo;
  if (nested && typeof nested === "object") {
    const student = nested as Record<string, unknown>;
    for (const key of keys) {
      const value = student[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

function statusTone(status = ""): "success" | "warning" | "danger" | "info" {
  const s = status.toLowerCase();
  if (s.includes("completed")) return "success";
  if (s.includes("pending") || s.includes("scheduled") || s.includes("accepted") || s.includes("waiting")) return "warning";
  if (s.includes("cancel") || s.includes("declined") || s.includes("expired")) return "danger";
  return "info";
}

const toneMap: Record<"success" | "warning" | "danger" | "info", string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/25 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/25 dark:text-amber-300",
  danger: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-900/25 dark:text-rose-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/40 dark:bg-sky-900/25 dark:text-sky-300",
};

function isPending(s: SessionRequest) {
  return s.status.toLowerCase().includes("pending") || s.status.toLowerCase().includes("waiting") || s.status.toLowerCase() === "pending_mentor";
}

function normalizeSessionRequest(row: SessionRequest): SessionRequest {
  const record = row as unknown as Record<string, unknown>;
  const fromRecord = calendarDateFromRecord(record);
  const session_date =
    fromRecord ||
    calendarDateFromApiValue(row.session_date) ||
    calendarDateFromApiValue((row as { sessionDate?: string }).sessionDate);
  const readable_id = sessionReadableIdFromRecord(record);
  const student_readable_id = pickStudentField(
    record,
    "student_readable_id",
    "studentReadableId",
    "readableId",
    "readable_id",
  );
  const student_name = pickStudentField(record, "student_name", "studentName", "name", "fullName");
  const student_gender = pickStudentField(record, "student_gender", "studentGender", "gender");
  const nestedStudent = row.student;
  return {
    ...row,
    session_date,
    readable_id: readable_id !== "—" ? readable_id : row.readable_id,
    student_readable_id: student_readable_id || row.student_readable_id,
    student_name: student_name || row.student_name,
    student_gender: student_gender || row.student_gender,
    student: nestedStudent
      ? {
          ...nestedStudent,
          name: nestedStudent.name ?? student_name,
          readableId: nestedStudent.readableId ?? student_readable_id,
          gender: nestedStudent.gender ?? student_gender,
        }
      : student_name || student_readable_id
        ? {
            name: student_name,
            readableId: student_readable_id,
            gender: student_gender,
          }
        : undefined,
  };
}

function filterByDay(list: SessionRequest[], filter: DayFilter): SessionRequest[] {
  return list.filter((s) => matchesDayFilter(s.session_date ?? "", filter));
}

// ─── Gender badge ─────────────────────────────────────────────
function GenderBadge({ gender }: { gender: string }) {
  if (!gender) return null;
  const label = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  const cls =
    gender.toLowerCase() === "male"
      ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40"
      : gender.toLowerCase() === "female"
        ? "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-800/40"
        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", cls)}>
      {label}
    </span>
  );
}

// ─── Detail row ───────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || "—"}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Session detail modal
// ─────────────────────────────────────────────────────────────
type ModalStep = "view" | "accept" | "decline" | "done";

function SessionModal({
  session,
  onClose,
  onUpdate,
}: {
  session: SessionRequest;
  onClose: () => void;
  onUpdate: (id: string, status: string) => void;
}) {
  const { notifySessionsUpdated } = useNotifications();
  const [step, setStep] = useState<ModalStep>("view");
  const [meetLink, setMeetLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sName = studentName(session);
  const sGender = studentGender(session);
  const sReadableId = studentReadableId(session);
  const sUniversity = session.student?.university ?? "";
  const sSemester = session.student?.semester ?? "";
  const t = topic(session);
  const time =
    session.startTime12h && session.endTime12h
      ? `${session.startTime12h} – ${session.endTime12h}`
      : session.start_time && session.end_time
        ? `${session.start_time.slice(0, 5)} – ${session.end_time.slice(0, 5)}`
        : "—";

  async function submitAccept() {
    setIsSubmitting(true);
    setError(null);
    try {
      const sid = sessionUuid(session);
      await apiFetch(`/live-sessions/sessions/${encodeURIComponent(sid)}/accept`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({ meetLink: meetLink.trim() }),
      });
      onUpdate(session.id, "accepted");
      notifySessionsUpdated();
      setStep("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitDecline() {
    setIsSubmitting(true);
    setError(null);
    try {
      const sid = sessionUuid(session);
      await apiFetch(`/live-sessions/sessions/${encodeURIComponent(sid)}/decline`, {
        method: "POST",
        auth: true,
      });
      onUpdate(session.id, "declined");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {step === "done" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Session Accepted!</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The Google Meet link has been sent to the student. See you in the session!
            </p>
            <Button onClick={onClose} className="mt-2">Done</Button>
          </div>
        ) : step === "view" ? (
          <>
            <h4 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Session Details</h4>
            <p className="mb-5 font-mono text-xs text-slate-400">ID: {session.readable_id ?? "—"}</p>

            {/* Student card */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-brand-primary/20">
              <div className="flex items-center gap-3 bg-brand-primary px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                  {sName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{sName}</p>
                  {sReadableId ? (
                    <p className="mt-0.5 truncate font-mono text-xs text-sky-100">ID: {sReadableId}</p>
                  ) : null}
                </div>
                <GenderBadge gender={sGender} />
              </div>
              {(sUniversity || sSemester) && (
                <div className="flex gap-4 bg-sky-50/70 px-4 py-2 dark:bg-sky-950/30">
                  {sUniversity && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                      {sUniversity}
                    </div>
                  )}
                  {sSemester && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {sSemester} Semester
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Session info */}
            <div className="grid grid-cols-2 gap-2">
              <DetailRow label="Topic" value={t} />
              <DetailRow label="Date" value={friendlyDate(session.session_date)} />
              <DetailRow label="Time" value={time} />
              <DetailRow label="Duration" value={session.duration_minutes ? `${session.duration_minutes} min` : undefined} />
              {session.price_bdt && <DetailRow label="Price" value={`৳${session.price_bdt}`} />}
              <DetailRow label="Status" value={session.status?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} />
            </div>

            {session.problem_description && (
              <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Problem Description</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{session.problem_description}</p>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>Close</Button>
              {isPending(session) && (
                <>
                  <Button
                    variant="secondary"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800/40 dark:text-rose-400"
                    iconLeft={XCircle}
                    onClick={() => { setStep("decline"); setError(null); }}
                  >
                    Decline
                  </Button>
                  <Button
                    iconLeft={CheckCircle2}
                    onClick={() => {
                      setStep("accept");
                      setError(null);
                    }}
                  >
                    Accept
                  </Button>
                </>
              )}
            </div>
          </>
        ) : step === "accept" ? (
          <>
            <h4 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Submit Meet Link</h4>
            <p className="mb-5 text-sm text-slate-500">
              Paste your Google Meet link to confirm this session for {sName}.
            </p>

            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800/40 dark:bg-sky-950/40">
              <p className="font-semibold text-sky-800 dark:text-sky-300">{t}</p>
              <p className="mt-0.5 text-xs text-sky-600 dark:text-sky-400">
                {friendlyDate(session.session_date)} · {time}
              </p>
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Google Meet Link <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 dark:border-slate-600 dark:bg-slate-700">
                <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-400">
                The student will receive this link instantly after confirmation.
              </p>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("view");
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={() => void submitAccept()}
                disabled={isSubmitting || !isValidGoogleMeetUrl(meetLink)}
              >
                {isSubmitting ? "Confirming…" : "Confirm Session"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h4 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Decline Request?</h4>
            <p className="mb-5 text-sm text-slate-500">This cannot be undone. The student will be notified.</p>

            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-400">
              <p className="font-semibold">{t}</p>
              <p className="mt-0.5 opacity-80">{sName} · {friendlyDate(session.session_date)}</p>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setStep("view"); setError(null); }} disabled={isSubmitting}>Back</Button>
              <Button
                className="bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-700"
                onClick={() => void submitDecline()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Declining…" : "Confirm Decline"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
const DAY_FILTERS: { value: DayFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "all", label: "All" },
];

export function MentorSessionRequests() {
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SessionRequest | null>(null);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all requests (not just today) so we can filter client-side by day
      const [allRaw, dashRaw] = await Promise.allSettled([
        apiFetch<TodayRequestsResponse>("/live-sessions/mentor/requests", { auth: true }),
        apiFetch<DashboardSummary>("/live-sessions/mentor/dashboard", { auth: true }),
      ]);

      if (allRaw.status === "fulfilled") {
        const raw = allRaw.value as unknown;
        let list: SessionRequest[];
        if (Array.isArray(raw)) {
          list = raw as SessionRequest[];
        } else {
          const r = raw as Record<string, unknown>;
          const found = ["items", "data", "sessions", "results", "requests"].find(k => Array.isArray(r?.[k]));
          list = found ? (r[found] as SessionRequest[]) : [];
        }
        setRequests(list.map(normalizeSessionRequest));
      } else {
        setError("Could not load session requests.");
      }

      if (dashRaw.status === "fulfilled") {
        setSummary(dashRaw.value);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        load().catch(() => setIsLoading(false));
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch
  }, []);

  // ── Filtered rows (client-side, instant) ────────────────────
  const visibleRequests = useMemo(() => filterByDay(requests, dayFilter), [requests, dayFilter]);

  // ── Quick stats (always based on "today" regardless of filter) ──
  const stats = useMemo(() => {
    const todayRows = filterByDay(requests, "today");
    const total = todayRows.length;
    const pending = todayRows.filter(isPending).length;
    const canceled = todayRows.filter(s =>
      s.status.toLowerCase().includes("cancel") || s.status.toLowerCase().includes("declined")
    ).length;
    const next = summary?.nextSession;
    const nextLabel = next
      ? `${friendlyDate(next.session_date)}${next.startTime12h ? ` · ${next.startTime12h}` : ""}`
      : "None scheduled";

    return [
      { label: "Total Sessions (Today)", value: String(total), trend: "Requests received today" },
      { label: "Pending Requests", value: String(pending), trend: "Awaiting your response" },
      { label: "Next Session", value: nextLabel, trend: next?.course_name ?? "Your upcoming confirmed session" },
      { label: "Canceled / Declined", value: String(canceled), trend: "From today's requests" },
    ];
  }, [requests, summary]);

  function handleUpdate(id: string, status: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (status === "declined") setSelected(null);
  }

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Session Requests</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {visibleRequests.length} request{visibleRequests.length !== 1 ? "s" : ""} &mdash;{" "}
              {DAY_FILTERS.find(f => f.value === dayFilter)?.label}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Day filter segmented control */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800/60">
              {DAY_FILTERS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setDayFilter(f.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    dayFilter === f.value
                      ? "bg-white text-sky-600 shadow-sm dark:bg-slate-700 dark:text-sky-400"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Refresh */}
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />Loading requests…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-rose-500">{error}</p>
            <button type="button" onClick={() => void load()} className="text-xs text-sky-600 underline">Retry</button>
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Clock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {dayFilter === "all"
                ? "No session requests"
                : `No session requests for ${DAY_FILTERS.find(f => f.value === dayFilter)?.label.toLowerCase()}`}
            </p>
            <p className="text-xs text-slate-400">Try a different filter or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Topic</th>
                  <th className="px-4 py-2.5">Date &amp; Time</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRequests.map((s) => {
                  const pending = isPending(s);
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 transition hover:bg-sky-50/40 dark:border-slate-700/60 dark:hover:bg-sky-950/20"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        {s.readable_id ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{studentName(s)}</p>
                        {studentReadableId(s) ? (
                          <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                            {studentReadableId(s)}
                          </p>
                        ) : null}
                        {studentGender(s) ? (
                          <span className="mt-0.5 block">
                            <GenderBadge gender={studentGender(s)} />
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{topic(s)}</td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 dark:text-slate-300">{friendlyDate(s.session_date)}</p>
                        <p className="text-xs text-slate-400">
                          {s.startTime12h ?? s.start_time?.slice(0, 5) ?? "—"}
                          {" "}–{" "}
                          {s.endTime12h ?? s.end_time?.slice(0, 5) ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", toneMap[statusTone(s.status)])}>
                          {s.status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <button
                            type="button"
                            title="View details"
                            onClick={() => setSelected(s)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-sky-600 transition hover:bg-sky-50 dark:border-sky-800/40 dark:text-sky-400 dark:hover:bg-sky-950/40"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Accept shortcut */}
                          {pending && (
                            <button
                              type="button"
                              title="Accept"
                              onClick={() => setSelected(s)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-800/40 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Decline shortcut */}
                          {pending && (
                            <button
                              type="button"
                              title="Decline"
                              onClick={() => setSelected(s)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-800/40 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

                          {/* More */}
                          <button
                            type="button"
                            title="More"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <SessionModal
          session={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </section>
  );
}
