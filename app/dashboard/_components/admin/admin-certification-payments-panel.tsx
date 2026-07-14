"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { formatApiErrorMessage } from "@/lib/api-errors";
import {
  approveAdminCertificationPayment,
  canIssueCertificationVoucher,
  canReviewCertificationPayment,
  listAdminCertificationBookings,
  patchAdminCertificationVoucher,
  rejectAdminCertificationPayment,
  type AdminCertificationBooking,
} from "@/lib/admin-certification-bookings-api";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Pagination } from "@/app/components/ui/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 5;

/** Matches backend `CertificationBookingStatus` enum. */
type StatusFilter =
  | "all"
  | "pending_payment"
  | "payment_submitted"
  | "payment_approved"
  | "voucher_issued"
  | "completed"
  | "cancelled"
  | "refunded";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "payment_submitted", label: "Payment submitted" },
  { value: "payment_approved", label: "Payment approved" },
  { value: "voucher_issued", label: "Voucher issued" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

const FILTER_SELECT =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("approved") || s.includes("voucher") || s.includes("issued") || s.includes("fulfilled")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (s.includes("submitted") || s.includes("pending") || s.includes("review")) {
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200";
  }
  if (s.includes("reject") || s.includes("cancel") || s.includes("failed")) {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300";
}

function formatMethod(method?: string) {
  if (!method) return "—";
  if (/^bkash$/i.test(method)) return "bKash";
  if (/^nagad$/i.test(method)) return "Nagad";
  return method;
}

/** e.g. `bkash . TRX-irj33333` */
function formatMethodTrxLine(method?: string, trxId?: string) {
  const m = method?.trim().toLowerCase();
  const t = trxId?.trim();
  if (!m && !t) return "—";
  if (m && t) return `${m} . ${t}`;
  return m || t || "—";
}

function formatAmountBdt(amount?: string) {
  if (!amount?.trim()) return "—";
  const n = Number(amount.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function matchesSearch(row: AdminCertificationBooking, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [
    row.readableId,
    row.studentReadableId,
    row.studentName,
    row.examTitle,
    row.examCode,
    row.trxId,
    row.paymentReferenceCode,
    row.voucherCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function CertificationBookingDetailModal({
  booking,
  onClose,
  onUpdated,
}: {
  booking: AdminCertificationBooking;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [rejectReason, setRejectReason] = useState(booking.rejectionReason ?? "");
  const [voucherCode, setVoucherCode] = useState(booking.voucherCode ?? "");
  const [voucherNotes, setVoucherNotes] = useState(booking.voucherNotes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reviewable = canReviewCertificationPayment(booking);
  const canVoucher = canIssueCertificationVoucher(booking);
  const amountLabel = formatAmountBdt(booking.amountBdt);

  async function runApprove() {
    setBusy(true);
    setMessage(null);
    try {
      await approveAdminCertificationPayment(booking.id);
      onUpdated();
      onClose();
    } catch (e) {
      setMessage(formatApiErrorMessage(e, "Approval failed."));
    } finally {
      setBusy(false);
    }
  }

  async function runReject() {
    setBusy(true);
    setMessage(null);
    try {
      await rejectAdminCertificationPayment(booking.id, rejectReason);
      setMessage("Payment rejected. Student has been notified.");
      onUpdated();
    } catch (e) {
      setMessage(formatApiErrorMessage(e, "Rejection failed."));
    } finally {
      setBusy(false);
    }
  }

  async function runVoucher() {
    if (!voucherCode.trim()) {
      setMessage("Enter a voucher code.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await patchAdminCertificationVoucher(booking.id, {
        voucherCode: voucherCode.trim(),
        voucherNotes: voucherNotes.trim() || undefined,
      });
      onUpdated();
      onClose();
    } catch (e) {
      setMessage(formatApiErrorMessage(e, "Could not save voucher."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} className="max-w-2xl rounded-2xl">
      <div className="max-h-[min(88vh,720px)] overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Certification booking</p>
            <h3 className="mt-1 font-mono text-lg font-bold text-slate-900 dark:text-slate-50">{booking.readableId}</h3>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{booking.examTitle ?? "—"}</p>
          </div>
          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusBadgeClass(booking.status))}>
            {formatStatus(booking.status)}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-800/40">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-500">Student</dt>
            <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
              {booking.studentName ?? "—"}
              {booking.studentReadableId ? (
                <span className="mt-0.5 block font-mono text-xs text-slate-500">{booking.studentReadableId}</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-500">Amount</dt>
            <dd className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-50">
              {amountLabel === "—" ? "—" : `৳${amountLabel}`}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-500">Method / TrxID</dt>
            <dd className="mt-0.5 font-mono text-sm text-slate-800 dark:text-slate-100">
              {formatMethodTrxLine(booking.paymentMethod, booking.trxId)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase text-slate-500">Payer number</dt>
            <dd className="mt-0.5 font-mono text-slate-800 dark:text-slate-100">{booking.payerNumber ?? "—"}</dd>
          </div>
          {booking.voucherCode ? (
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-semibold uppercase text-slate-500">Voucher</dt>
              <dd className="mt-0.5 font-mono font-semibold text-emerald-800 dark:text-emerald-200">{booking.voucherCode}</dd>
            </div>
          ) : null}
        </dl>

        {reviewable ? (
          <section className="mt-4 overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <header className="border-b border-amber-100 px-4 py-3 dark:border-amber-900/30">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">Payment review</p>
            </header>
            <div className="space-y-3 p-4">
              <label className="block text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Rejection reason (optional)</span>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Shown to student if rejected"
                  className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void runReject()}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300"
                  iconLeft={busy ? Loader2 : X}
                >
                  Reject payment
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runApprove()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  iconLeft={busy ? Loader2 : Check}
                >
                  Approve payment
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {canVoucher ? (
          <section className="mt-4 overflow-hidden rounded-2xl border border-sky-200/90 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20">
            <header className="flex items-center gap-2 border-b border-sky-100 px-4 py-3 dark:border-sky-900/30">
              <Ticket className="h-4 w-4 text-sky-700 dark:text-sky-300" />
              <p className="text-sm font-semibold text-sky-950 dark:text-sky-100">Issue exam voucher</p>
            </header>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Voucher code</span>
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
                  placeholder="EXAM-VOUCHER-XXXX"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="font-medium text-slate-700 dark:text-slate-300">Notes (optional)</span>
                <textarea
                  value={voucherNotes}
                  onChange={(e) => setVoucherNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="button" size="sm" disabled={busy} onClick={() => void runVoucher()} iconLeft={Ticket}>
                  Save voucher
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {message ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}

        <div className="mt-5 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function AdminCertificationPaymentsPanel() {
  const [rows, setRows] = useState<AdminCertificationBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [reviewQueueOnly, setReviewQueueOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<AdminCertificationBooking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listAdminCertificationBookings({
        page,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setRows(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(formatApiErrorMessage(e, "Failed to load certification bookings."));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, reviewQueueOnly, search]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (reviewQueueOnly && !canReviewCertificationPayment(row)) return false;
      return matchesSearch(row, search);
    });
  }, [rows, reviewQueueOnly, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);

  async function approve(bookingId: string) {
    setBusyId(bookingId);
    try {
      await approveAdminCertificationPayment(bookingId);
      await load();
    } catch (e) {
      setError(formatApiErrorMessage(e, "Approve failed."));
    } finally {
      setBusyId(null);
    }
  }

  async function reject(bookingId: string) {
    setBusyId(bookingId);
    try {
      await rejectAdminCertificationPayment(bookingId, "");
      await load();
    } catch (e) {
      setError(formatApiErrorMessage(e, "Reject failed."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Certification exam payments</h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Review student certification payments, approve or reject, then issue exam vouchers.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" iconLeft={RefreshCw} onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/20">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booking ID, student ID, exam, or TrxID…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[11rem] flex-1 sm:max-w-[14rem]">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Status</span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className={FILTER_SELECT}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
          <button
            type="button"
            onClick={() => setReviewQueueOnly((v) => !v)}
            className={cn(
              "h-10 rounded-xl border px-3 text-xs font-semibold transition",
              reviewQueueOnly
                ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300",
            )}
          >
            Needs review only
          </button>
          {(search || statusFilter !== "all" || reviewQueueOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setReviewQueueOnly(false);
              }}
              className="h-10 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          {total} booking{total === 1 ? "" : "s"} total · {PAGE_SIZE} per page (newest first)
        </p>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {loading ? (
        <p className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading certification bookings…
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Exam</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRows.map((row) => {
              const reviewable = canReviewCertificationPayment(row);
              const busy = busyId === row.id;
              const amountLabel = formatAmountBdt(row.amountBdt);
              return (
                <tr key={row.id} className="bg-white transition hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {row.readableId}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{row.studentName ?? "—"}</p>
                    {row.studentReadableId ? (
                      <p className="font-mono text-xs text-slate-500">{row.studentReadableId}</p>
                    ) : null}
                  </td>
                  <td className="max-w-[180px] px-4 py-3">
                    <p className="truncate font-medium text-slate-800 dark:text-slate-100" title={row.examTitle}>
                      {row.examTitle ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">{row.vendorName ?? row.examCode ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {amountLabel === "—" ? "—" : `৳${amountLabel}`}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                    {formatMethod(row.paymentMethod)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusBadgeClass(row.status))}>
                      {formatStatus(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="View details"
                        onClick={() => setDetailBooking(row)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:hover:bg-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {reviewable ? (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            title="Approve payment"
                            onClick={() => void approve(row.id)}
                            className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            title="Reject payment"
                            onClick={() => void reject(row.id)}
                            className="rounded-lg border border-rose-200 p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                      {canIssueCertificationVoucher(row) ? (
                        <button
                          type="button"
                          title="Issue voucher"
                          onClick={() => setDetailBooking(row)}
                          className="rounded-lg border border-sky-200 p-2 text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300"
                        >
                          <Ticket className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredRows.length && !loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  No certification payment requests match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!loading && total > 0 ? (
        <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      ) : null}

      {detailBooking ? (
        <CertificationBookingDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onUpdated={() => {
            void load();
          }}
        />
      ) : null}
    </section>
  );
}
