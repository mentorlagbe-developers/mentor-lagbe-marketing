"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Pagination } from "@/app/components/ui/pagination";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { formatStatus, statusTone, toneClasses } from "@/app/dashboard/_components/mentor/mentor-session-utils";
import { formatApiErrorMessage } from "@/lib/api-errors";
import {
  formatBdtAmount,
  listMentorEarnings,
  type MentorEarningsItem,
  type MentorEarningsSummary,
} from "@/lib/mentor-earnings-api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type PayoutFilter = "all" | "approved" | "pending";

const PAYOUT_FILTERS: { value: PayoutFilter; label: string }[] = [
  { value: "all", label: "All payouts" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
];

function friendlyDate(raw?: string): string {
  if (!raw?.trim()) return "—";
  const value = raw.trim();
  const d = new Date(value.includes("T") ? value : `${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso?: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleString("en-BD", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function payoutTone(status: string): "success" | "warning" | "neutral" {
  const s = status.toLowerCase();
  if (s.includes("approved") || s.includes("paid")) return "success";
  if (s.includes("pending")) return "warning";
  return "neutral";
}

function payoutBadgeClass(tone: "success" | "warning" | "neutral") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300";
}

function buildStats(summary: MentorEarningsSummary) {
  return [
    {
      label: "Approved Earnings",
      value: `৳${formatBdtAmount(summary.approved.mentorEarningsBdt)}`,
      trend: `${summary.approved.count} approved session${summary.approved.count === 1 ? "" : "s"}`,
    },
    {
      label: "Pending Earnings",
      value: `৳${formatBdtAmount(summary.pending.mentorEarningsBdt)}`,
      trend: `${summary.pending.count} session${summary.pending.count === 1 ? "" : "s"} awaiting payout`,
    },
    {
      label: "Your Share",
      value: `${summary.mentorSharePercent}%`,
      trend: "Mentor revenue split per session",
    },
    {
      label: "Platform Share",
      value: `${summary.platformSharePercent}%`,
      trend: "Platform revenue split per session",
    },
  ];
}

function EarningsDetailModal({
  item,
  onClose,
}: {
  item: MentorEarningsItem;
  onClose: () => void;
}) {
  const payout = payoutTone(item.payoutStatus);

  return (
    <Modal open onClose={onClose} className="w-full max-w-xl">
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Earnings details</h2>
          <p className="mt-1 font-mono text-xs text-slate-400">
            Session ID: {item.sessionReadableId || item.sessionId || "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Session date", value: friendlyDate(item.sessionDate) },
            { label: "Session status", value: formatStatus(item.sessionStatus) },
            { label: "Payout status", value: formatStatus(item.payoutStatus) },
            { label: "Session price", value: `৳${formatBdtAmount(item.sessionPriceBdt)}` },
            { label: "Your earnings", value: `৳${formatBdtAmount(item.mentorEarningsBdt)}` },
            { label: "Your share", value: `${item.mentorSharePercent}%` },
            { label: "Platform share", value: `${item.platformSharePercent}%` },
            { label: "Session ended", value: formatDateTime(item.sessionEndedAt) },
            { label: "Recorded", value: formatDateTime(item.createdAt) },
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

        <div className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 dark:border-sky-800/40 dark:bg-sky-950/30">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-300">
              Payout
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              ৳{formatBdtAmount(item.mentorEarningsBdt)}
            </p>
          </div>
          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", payoutBadgeClass(payout))}>
            {formatStatus(item.payoutStatus)}
          </span>
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

export function MentorEarningsSection() {
  const [rows, setRows] = useState<MentorEarningsItem[]>([]);
  const [summary, setSummary] = useState<MentorEarningsSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<MentorEarningsItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listMentorEarnings({
        page,
        limit: PAGE_SIZE,
        payoutStatus: payoutFilter === "all" ? undefined : payoutFilter,
      });
      setRows(result.items);
      setSummary(result.summary);
      setTotal(result.pagination.total);
    } catch (e) {
      setError(formatApiErrorMessage(e, "Could not load earnings."));
      setRows([]);
      setSummary(null);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, payoutFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const stats = useMemo(() => buildStats(summary ?? {
    mentorSharePercent: 0,
    platformSharePercent: 0,
    approved: { count: 0, sessionPriceBdt: "0", mentorEarningsBdt: "0", platformFeeBdt: "0" },
    pending: { count: 0, sessionPriceBdt: "0", mentorEarningsBdt: "0", platformFeeBdt: "0" },
  }), [summary]);

  function handlePayoutFilterChange(value: PayoutFilter) {
    setPayoutFilter(value);
    setPage(1);
  }

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      {viewItem ? <EarningsDetailModal item={viewItem} onClose={() => setViewItem(null)} /> : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Session Earnings</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Completed live sessions and payout status. Platform share is shown as a percentage only.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={payoutFilter}
              onChange={(e) => handlePayoutFilterChange(e.target.value as PayoutFilter)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-sky-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {PAYOUT_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="button" variant="secondary" size="sm" iconLeft={RefreshCw} disabled={loading} onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading earnings…
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
            <Wallet className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No earnings yet</p>
            <p className="text-xs text-slate-400">Completed sessions with payouts will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Session ID</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Session Status</th>
                  <th className="px-4 py-2.5">Payout</th>
                  <th className="px-4 py-2.5">Price</th>
                  <th className="px-4 py-2.5">Your Earnings</th>
                  <th className="px-4 py-2.5">Platform %</th>
                  <th className="px-4 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const payout = payoutTone(row.payoutStatus);
                  return (
                    <tr
                      key={row.sessionId || `${row.sessionReadableId}-${index}`}
                      className="border-b border-slate-100 transition hover:bg-sky-50/40 dark:border-slate-700/60 dark:hover:bg-sky-950/20"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500">{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {row.sessionReadableId || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{friendlyDate(row.sessionDate)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            toneClasses(statusTone(row.sessionStatus)),
                          )}
                        >
                          {formatStatus(row.sessionStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            payoutBadgeClass(payout),
                          )}
                        >
                          {formatStatus(row.payoutStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        ৳{formatBdtAmount(row.sessionPriceBdt)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300">
                        ৳{formatBdtAmount(row.mentorEarningsBdt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.platformSharePercent}%</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          title="View earnings details"
                          aria-label={`View earnings for ${row.sessionReadableId}`}
                          onClick={() => setViewItem(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/40"
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
