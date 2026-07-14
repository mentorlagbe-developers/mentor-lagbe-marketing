"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Eye, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Pagination } from "@/app/components/ui/pagination";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { formatApiErrorMessage } from "@/lib/api-errors";
import {
  listMyPayments,
  matchesPaymentDate,
  matchesPaymentSearch,
  paymentDisplayDate,
  toPaymentUiStatus,
  type PaymentUiStatus,
  type StudentPaymentItem,
  type StudentPaymentType,
} from "@/lib/student-payments-api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;
const FETCH_ALL_LIMIT = 100;

type TypeFilter = "all" | StudentPaymentType;

const FILTER_SELECT =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusTone(status: PaymentUiStatus): "success" | "warning" | "danger" {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  return "danger";
}

function badgeToneClass(tone: "success" | "warning" | "danger") {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700/50 dark:bg-rose-900/30 dark:text-rose-300";
}

function formatMethod(method: string) {
  if (!method) return "—";
  if (/^bkash$/i.test(method)) return "bKash";
  if (/^nagad$/i.test(method)) return "Nagad";
  return method;
}

function formatAmountBdt(amount: string) {
  const n = Number(amount.replace(/,/g, ""));
  if (!Number.isFinite(n)) return amount || "—";
  return n.toLocaleString("en-BD", { maximumFractionDigits: 2 });
}

function formatDateTime(iso?: string | null) {
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

function typeLabel(type: StudentPaymentType) {
  return type === "certification" ? "Certification" : "Live session";
}

function PaymentDetailModal({
  payment,
  onClose,
}: {
  payment: StudentPaymentItem;
  onClose: () => void;
}) {
  const uiStatus = toPaymentUiStatus(payment.status);

  return (
    <Modal open onClose={onClose} className="h-auto w-full max-w-4xl">
      <div className="w-full p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment details</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{payment.referenceCode || payment.id}</p>
            <p className="mt-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">{typeLabel(payment.type)}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">৳{formatAmountBdt(payment.amountBdt)}</p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                badgeToneClass(getStatusTone(uiStatus)),
              )}
            >
              {formatStatusLabel(payment.status)}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <DetailItem label="Booking ID" value={payment.bookingReadableId || "—"} />
          <DetailItem label="Method" value={formatMethod(payment.paymentMethod)} />
          <DetailItem label="TrxID" value={payment.trxId || "—"} />
          <DetailItem label="Payer number" value={payment.payerNumber || "—"} />
          <DetailItem
            label={payment.type === "certification" ? "Exam date" : "Session date"}
            value={payment.sessionDate?.slice(0, 10) || "—"}
          />
          <DetailItem label="Submitted" value={formatDateTime(payment.submittedAt)} />
          <DetailItem label="Reviewed" value={formatDateTime(payment.reviewedAt)} />
          {payment.examCode ? <DetailItem label="Exam code" value={payment.examCode} /> : null}
        </dl>

        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300" title={payment.title}>
          <span className="font-medium text-slate-500 dark:text-slate-400">
            {payment.type === "certification" ? "Exam: " : "Session: "}
          </span>
          {payment.title}
        </p>

        {payment.rejectionReason ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            <span className="font-semibold">Rejection reason: </span>
            {payment.rejectionReason}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-slate-800 dark:text-slate-100" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function PaymentsSection() {
  const [rows, setRows] = useState<StudentPaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statsRows, setStatsRows] = useState<StudentPaymentItem[]>([]);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<StudentPaymentItem | null>(null);

  const usesClientFilters = Boolean(search.trim() || dateFilter.trim());
  const apiType = typeFilter === "all" ? undefined : typeFilter;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (usesClientFilters) {
        const result = await listMyPayments({ page: 1, limit: FETCH_ALL_LIMIT, type: apiType });
        setRows(result.items);
        setTotal(result.items.length);
      } else {
        const result = await listMyPayments({ page, limit: PAGE_SIZE, type: apiType });
        setRows(result.items);
        setTotal(result.pagination.total);
      }
    } catch (e) {
      setError(formatApiErrorMessage(e, "Could not load payment history."));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, apiType, usesClientFilters]);

  const loadStats = useCallback(async () => {
    try {
      const result = await listMyPayments({ page: 1, limit: FETCH_ALL_LIMIT });
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

  const filteredRows = useMemo(() => {
    return rows.filter((row) => matchesPaymentSearch(row, search) && matchesPaymentDate(row, dateFilter));
  }, [rows, search, dateFilter]);

  const displayTotal = usesClientFilters ? filteredRows.length : total;
  const totalPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE) || 1);
  const clampedPage = Math.min(page, totalPages);
  const pagedPayments = usesClientFilters
    ? filteredRows.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)
    : filteredRows;

  const stats = useMemo(() => {
    const completed = statsRows.filter((p) => toPaymentUiStatus(p.status) === "completed").length;
    const pending = statsRows.filter((p) => toPaymentUiStatus(p.status) === "pending").length;
    const failed = statsRows.filter((p) => toPaymentUiStatus(p.status) === "failed").length;
    const nextDue = statsRows.find((p) => toPaymentUiStatus(p.status) === "pending");
    return [
      { label: "Total Payments", value: String(statsRows.length), trend: "All submitted payments" },
      { label: "Approved", value: String(completed), trend: "Successfully verified" },
      { label: "Pending review", value: String(pending), trend: "Awaiting confirmation" },
      { label: "Rejected / refunded", value: String(failed), trend: "Not approved" },
      ...(nextDue
        ? [
            {
              label: "Latest pending",
              value: nextDue.bookingReadableId,
              trend: `${nextDue.title} · ৳${formatAmountBdt(nextDue.amountBdt)}`,
            },
          ]
        : []),
    ].slice(0, 4);
  }, [statsRows]);

  function handleTypeChange(value: TypeFilter) {
    setTypeFilter(value);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleDateChange(value: string) {
    setDateFilter(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setDateFilter("");
    setTypeFilter("all");
    setPage(1);
  }

  const filtersActive = typeFilter !== "all" || search.trim() || dateFilter;

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment History</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Live session and certification exam payments in one place.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            iconLeft={RefreshCw}
            disabled={loading}
            onClick={() => {
              void load();
              void loadStats();
            }}
          >
            Refresh
          </Button>
        </div>

        <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search payment ID, booking ID (SES-/CERT-), TrxID…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[11rem] flex-1 sm:max-w-[14rem]">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Payment type
              </span>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => handleTypeChange(e.target.value as TypeFilter)}
                  className={FILTER_SELECT}
                >
                  <option value="all">All types</option>
                  <option value="session">Live sessions</option>
                  <option value="certification">Certification exams</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
            <label className="min-w-[11rem] flex-1 sm:max-w-[12rem]">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Date
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </label>
            {filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                Clear filters
              </button>
            ) : null}
          </div>
          <p className="text-xs text-slate-500">
            {displayTotal} payment{displayTotal === 1 ? "" : "s"}
            {usesClientFilters ? " matching filters" : " total"}
          </p>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {loading ? (
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
          </p>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-3 py-2">Payment ID</th>
                <th className="px-3 py-2">Booking</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading &&
                pagedPayments.map((payment) => {
                  const uiStatus = toPaymentUiStatus(payment.status);
                  return (
                    <tr
                      key={`${payment.type}-${payment.id}`}
                      className="border-b border-slate-100 transition hover:bg-sky-50/50 dark:border-slate-700 dark:hover:bg-sky-950/30"
                    >
                      <td className="px-3 py-2 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                        {payment.referenceCode || "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {payment.bookingReadableId || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            payment.type === "certification"
                              ? "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200"
                              : "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
                          )}
                        >
                          {payment.type === "certification" ? "Cert" : "Session"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{paymentDisplayDate(payment)}</td>
                      <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                        ৳{formatAmountBdt(payment.amountBdt)}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {formatMethod(payment.paymentMethod)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            badgeToneClass(getStatusTone(uiStatus)),
                          )}
                        >
                          {formatStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setSelected(payment)}
                          className="inline-flex items-center justify-center rounded-lg border border-sky-200 p-2 text-sky-600 transition hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/50"
                          aria-label={`View payment ${payment.referenceCode}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {!loading && !pagedPayments.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    No payments match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {!loading && displayTotal > 0 ? (
          <Pagination
            className="mt-4"
            page={clampedPage}
            totalPages={totalPages}
            totalItems={displayTotal}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </article>

      {selected ? <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
