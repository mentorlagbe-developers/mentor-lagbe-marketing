"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Pagination } from "@/app/components/ui/pagination";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import {
  formatStatus,
  statusTone,
  toneClasses,
} from "@/app/dashboard/_components/mentor/mentor-session-utils";
import { formatApiErrorMessage } from "@/lib/api-errors";
import {
  countByStatus,
  countUniqueStudents,
  historyTopicLabel,
  listMentorStudentHistory,
  type MentorStudentHistoryItem,
} from "@/lib/mentor-student-history-api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const STATS_FETCH_LIMIT = 100;

type StatusFilter = "all" | "completed" | "payment_approved" | "scheduled" | "cancelled";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "payment_approved", label: "Payment approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "cancelled", label: "Cancelled" },
];

function friendlyDate(raw?: string): string {
  if (!raw?.trim()) return "—";
  const value = raw.trim();
  const d = new Date(value.includes("T") ? value : `${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(item: MentorStudentHistoryItem): { date: string; time: string } {
  const date = friendlyDate(item.sessionDate);
  const start = item.startTime12h || item.startTime || "";
  const end = item.endTime12h || item.endTime || "";
  if (start && end) return { date, time: `${start} – ${end}` };
  if (start) return { date, time: start };
  return { date, time: "—" };
}

function HistorySessionDetailModal({
  session,
  onClose,
}: {
  session: MentorStudentHistoryItem;
  onClose: () => void;
}) {
  const { date, time } = formatDateTime(session);
  const topic = historyTopicLabel(session);

  return (
    <Modal open onClose={onClose} className="w-full max-w-xl">
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session details</h2>
          <p className="mt-1 font-mono text-xs text-slate-400">
            Session ID: {session.readableId || session.id || "—"}
          </p>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 dark:border-sky-800/40 dark:bg-sky-950/30">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-300">
            Student ID
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
            {session.studentReadableId}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Personal name and contact details are hidden on this page.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Topic", value: topic },
            { label: "Course", value: session.courseName || "—" },
            { label: "Department", value: session.departmentName || "—" },
            { label: "Date", value: date },
            { label: "Time", value: time },
            {
              label: "Duration",
              value: session.durationMinutes ? `${session.durationMinutes} min` : "—",
            },
            { label: "Status", value: formatStatus(session.status) },
            { label: "Price", value: session.priceBdt ? `৳${session.priceBdt}` : "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function MentorStudentsSection() {
  const [rows, setRows] = useState<MentorStudentHistoryItem[]>([]);
  const [statsRows, setStatsRows] = useState<MentorStudentHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewSession, setViewSession] = useState<MentorStudentHistoryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMentorStudentHistory({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRows(result.items);
      setTotal(result.pagination.total);
    } catch (e) {
      setError(formatApiErrorMessage(e, "Could not load student session history."));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const loadStats = useCallback(async () => {
    try {
      const result = await listMentorStudentHistory({ page: 1, limit: STATS_FETCH_LIMIT });
      setStatsRows(result.items);
    } catch {
      setStatsRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);

  const stats = useMemo(() => {
    const uniqueStudents = countUniqueStudents(statsRows);
    const completed = countByStatus(statsRows, (s) => s.includes("completed"));
    const approved = countByStatus(statsRows, (s) => s.includes("payment_approved") || s.includes("approved"));
    const cancelled = countByStatus(statsRows, (s) => s.includes("cancel") || s.includes("declined"));
    const totalSessions = total || statsRows.length;

    return [
      {
        label: "Total Sessions",
        value: String(totalSessions),
        trend: "Sessions you have mentored",
      },
      {
        label: "Unique Students",
        value: String(uniqueStudents),
        trend:
          totalSessions > STATS_FETCH_LIMIT
            ? `Distinct IDs in latest ${STATS_FETCH_LIMIT} records`
            : "Distinct student IDs only",
      },
      {
        label: "Completed",
        value: String(completed),
        trend: "Finished live sessions",
      },
      {
        label: "Approved / Active",
        value: String(approved),
        trend: `${cancelled} cancelled or declined`,
      },
    ];
  }, [statsRows, total]);

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      {viewSession ? (
        <HistorySessionDetailModal session={viewSession} onClose={() => setViewSession(null)} />
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">My Students</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value as StatusFilter)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-sky-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                void load();
                void loadStats();
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-sky-300 hover:text-sky-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading student history…
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
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No student sessions yet</p>
            <p className="text-xs text-slate-400">Accepted and completed sessions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Session ID</th>
                  <th className="px-4 py-2.5">Student ID</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Session Status</th>
                  <th className="px-4 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const { date, time } = formatDateTime(row);
                  return (
                    <tr
                      key={row.id || `${row.studentReadableId}-${index}`}
                      className="border-b border-slate-100 transition hover:bg-sky-50/40 dark:border-slate-700/60 dark:hover:bg-sky-950/20"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {row.readableId || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {row.studentReadableId}
                      </td>
                      <td className="max-w-[180px] px-4 py-3">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-100" title={row.courseName}>
                          {row.courseName || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{date}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            toneClasses(statusTone(row.status)),
                          )}
                        >
                          {formatStatus(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          disabled={!row.id}
                          title="View session details"
                          aria-label={`View session details for ${row.studentReadableId}`}
                          onClick={() => setViewSession(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/40"
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

        {!loading && total > 0 ? (
          <Pagination
            className="px-5 py-4"
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </div>
    </section>
  );
}
