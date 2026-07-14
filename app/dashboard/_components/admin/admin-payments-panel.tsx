"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { AdminCertificationPaymentsPanel } from "@/app/dashboard/_components/admin/admin-certification-payments-panel";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Pagination } from "@/app/components/ui/pagination";
import { cn } from "@/lib/utils";

type PendingPayment = {
  id: string;
  readableId?: string;
  amountBdt?: string;
  paymentMethod?: string;
  trxId?: string;
  payerNumber?: string;
  sessionId?: string;
  studentName?: string;
  createdAt?: string;
};

type PaymentsTab = "sessions" | "certifications";

const PAGE_SIZE = 10;

function parsePendingList(raw: unknown): PendingPayment[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  const items = r.items ?? r.data ?? r.payments ?? r.records;
  if (!Array.isArray(items)) return [];
  return items
    .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object"))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      readableId: typeof item.readableId === "string" ? item.readableId : undefined,
      amountBdt: typeof item.amountBdt === "string" ? item.amountBdt : String(item.amountBdt ?? ""),
      paymentMethod: typeof item.paymentMethod === "string" ? item.paymentMethod : undefined,
      trxId: typeof item.trxId === "string" ? item.trxId : undefined,
      payerNumber: typeof item.payerNumber === "string" ? item.payerNumber : undefined,
      sessionId: typeof item.sessionId === "string" ? item.sessionId : undefined,
      studentName: typeof item.studentName === "string" ? item.studentName : undefined,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : undefined,
    }))
    .filter((p) => p.id);
}

function tabClass(active: boolean) {
  return cn(
    "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
    active
      ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  );
}

function LiveSessionPaymentsSection() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = await apiFetch<unknown>(`/admin/payments/pending?page=${page}&limit=${PAGE_SIZE}`, {
        auth: true,
      });
      setPayments(parsePendingList(raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pending payments.");
      setPayments([]);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE) || 1);

  async function approve(paymentId: string) {
    setBusyId(paymentId);
    try {
      await apiFetch(`/admin/payments/${encodeURIComponent(paymentId)}/approve`, {
        method: "POST",
        auth: true,
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Approve failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(paymentId: string) {
    setBusyId(paymentId);
    try {
      await apiFetch(`/admin/payments/${encodeURIComponent(paymentId)}/reject`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          rejectionReason: rejectReason[paymentId]?.trim() || "Payment could not be verified.",
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Reject failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Approve or reject student live session payments. Students are notified via in-app and WhatsApp.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60">
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Method / TrxID</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700">
                <td className="px-3 py-2 font-medium">{p.readableId ?? p.id.slice(0, 8)}</td>
                <td className="px-3 py-2">{p.studentName ?? "—"}</td>
                <td className="px-3 py-2">৳{p.amountBdt ?? "—"}</td>
                <td className="px-3 py-2">
                  <p>{p.paymentMethod ?? "—"}</p>
                  <p className="text-xs text-slate-500">{p.trxId ?? ""}</p>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col items-end gap-2">
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      value={rejectReason[p.id] ?? ""}
                      onChange={(e) => setRejectReason((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="h-8 w-full max-w-xs rounded-lg border border-slate-200 px-2 text-xs dark:border-slate-600 dark:bg-slate-900"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void approve(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => void reject(p.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!payments.length && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No pending live session payments.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {payments.length > PAGE_SIZE ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      ) : null}
    </section>
  );
}

export function AdminPaymentsPanel() {
  const [tab, setTab] = useState<PaymentsTab>("certifications");

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Super admin</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">Payments</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Review and approve student payments for live sessions and certification exams.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1 dark:border-slate-700">
        <button type="button" className={tabClass(tab === "certifications")} onClick={() => setTab("certifications")}>
          Certification exams
        </button>
        <button type="button" className={tabClass(tab === "sessions")} onClick={() => setTab("sessions")}>
          Live sessions
        </button>
      </div>

      {tab === "certifications" ? <AdminCertificationPaymentsPanel /> : <LiveSessionPaymentsSection />}
    </section>
  );
}
