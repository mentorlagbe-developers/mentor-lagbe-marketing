"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";
import { Pagination } from "@/app/components/ui/pagination";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import {
  getMockPayments,
  MOCK_UPCOMING_DUE,
  type PaymentRecord,
  type PaymentStatus,
} from "@/lib/mock-payments";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

function formatStatus(status: PaymentStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusTone(status: PaymentStatus): "success" | "warning" | "danger" {
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

function formatMethod(method: PaymentRecord["method"]) {
  if (method === "bkash") return "bKash";
  if (method === "nagad") return "Nagad";
  return "Card";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleString("en-BD", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PaymentDetailModal({
  payment,
  onClose,
}: {
  payment: PaymentRecord;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} className="h-auto w-full max-w-4xl">
      <div className="w-full p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment details</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{payment.readableId}</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ৳{payment.amountBdt.toLocaleString()}
            </p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold",
                badgeToneClass(getStatusTone(payment.status))
              )}
            >
              {formatStatus(payment.status)}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <DetailItem label="Method" value={formatMethod(payment.method)} />
          <DetailItem label="TrxID" value={payment.trxId} />
          <DetailItem label="Session" value={payment.sessionId} />
          <DetailItem label="Session date" value={payment.sessionDate} />
          <DetailItem label="Mentor" value={payment.mentorName} />
          <DetailItem label="Paid at" value={formatDateTime(payment.paidAt)} />
        </dl>

        <p className="mt-3 truncate text-sm text-slate-600 dark:text-slate-300" title={payment.sessionTopic}>
          <span className="font-medium text-slate-500 dark:text-slate-400">Topic: </span>
          {payment.sessionTopic}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Timeline</p>
          <ol className="mt-2 flex flex-wrap gap-2">
            {payment.timeline.map((step, index) => (
              <li
                key={`${step.label}-${index}`}
                className="min-w-[8.5rem] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800/60"
              >
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{step.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(step.at)}</p>
                {step.note ? (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400" title={step.note}>
                    {step.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

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
  const [payments] = useState(() => getMockPayments());
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PaymentRecord | null>(null);

  const stats = useMemo(() => {
    const completed = payments.filter((p) => p.status === "completed").length;
    const pending = payments.filter((p) => p.status === "pending").length;
    const failed = payments.filter((p) => p.status === "failed").length;
    return [
      {
        label: "Total Payments",
        value: String(completed),
        trend: "Completed payments",
      },
      {
        label: "Pending Payments",
        value: String(pending),
        trend: "Awaiting confirmation",
      },
      {
        label: "Failed Payments",
        value: String(failed),
        trend: "Could not be verified",
      },
      {
        label: "Upcoming Due",
        value: MOCK_UPCOMING_DUE ? `৳${MOCK_UPCOMING_DUE.amountBdt.toLocaleString()}` : "—",
        trend: MOCK_UPCOMING_DUE
          ? `${MOCK_UPCOMING_DUE.sessionTopic} · ${MOCK_UPCOMING_DUE.sessionDate}`
          : "No upcoming payment due",
      },
    ];
  }, [payments]);

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const pagedPayments = payments.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Payment History</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and track all session payments. Data is sample until the payments API is connected.
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                <th className="px-3 py-2">Payment ID</th>
                <th className="px-3 py-2">Session</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-100 transition hover:bg-sky-50/50 dark:border-slate-700 dark:hover:bg-sky-950/30"
                >
                  <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                    {payment.readableId}
                  </td>
                  <td className="max-w-40 truncate px-3 py-2 text-slate-600 dark:text-slate-400" title={payment.sessionTopic}>
                    {payment.sessionId}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{payment.sessionDate}</td>
                  <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                    ৳{payment.amountBdt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{formatMethod(payment.method)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-semibold",
                        badgeToneClass(getStatusTone(payment.status))
                      )}
                    >
                      {formatStatus(payment.status)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => setSelected(payment)}
                      className="inline-flex items-center justify-center rounded-lg border border-sky-200 p-2 text-sky-600 transition hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/50"
                      aria-label={`View payment ${payment.readableId}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!pagedPayments.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    No payments found yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {payments.length > PAGE_SIZE ? (
          <Pagination
            className="mt-4"
            page={clampedPage}
            totalPages={totalPages}
            totalItems={payments.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        ) : null}
      </article>

      {selected ? <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  );
}
