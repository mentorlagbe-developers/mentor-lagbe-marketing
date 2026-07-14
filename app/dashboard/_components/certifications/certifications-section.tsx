"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleX, CreditCard, Eye } from "lucide-react";
import { Modal } from "@/app/components/ui/modal";
import { PolicyConsentModal } from "@/app/components/ui/policy-consent-modal";
import { Pagination } from "@/app/components/ui/pagination";
import { CertificationExamCardView } from "@/app/certifications/_components/certification-exam-card";
import { Button } from "@/app/components/ui/button";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { ApiError } from "@/lib/api";
import { formatApiErrorMessage } from "@/lib/api-errors";
import { isValidBdPhoneForCertPayment } from "@/lib/bd-phone";
import { CERT_BOOKING_CONSENT, CERT_PAYMENT_CONSENT } from "@/lib/policy-consents";
import {
  bookCertificationExam,
  cancelMyCertificationBooking,
  type CertificationBooking,
  type CertificationBookingDetail,
  type CertificationExamCard,
  type CertificationPaymentMethod,
  getMyCertificationBooking,
  listCertificationExams,
  listCertificationVendors,
  listMyCertificationBookings,
  normalizeCertificationAmountBdt,
  payMyCertificationBooking,
  studentCertificationBookingCanCancel,
} from "@/lib/certifications-api";

const EXAMS_PAGE_SIZE = 6;
const BOOKINGS_PAGE_SIZE = 5;

function formatCurrencyBdt(value: string | number) {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function toStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function statusBadgeClass(status: string) {
  if (status.includes("approved") || status.includes("issued")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (status.includes("pending") || status.includes("submitted") || status.includes("review")) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-300";
  }
  if (status.includes("cancel") || status.includes("reject") || status.includes("failed")) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/30 dark:text-rose-300";
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function canSubmitCertificationPayment(status: string) {
  return status.toLowerCase().replace(/\s+/g, "_") === "pending_payment";
}

function isCertificationPaymentUnderReview(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  return s === "payment_submitted" || s.includes("payment_submitted") || s.includes("under_review");
}

function isVoucherReadyStatus(status: string) {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  return (
    s === "voucher_issued" ||
    s.includes("voucher_issued") ||
    s === "completed" ||
    s === "payment_approved" ||
    s.includes("fulfilled")
  );
}

function formatDateTime(iso?: string | null) {
  if (!iso?.trim()) return "N/A";
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

type CancelCertificationModalProps = {
  booking: CertificationBooking;
  onClose: () => void;
  onCancelled: () => void;
};

function CancelCertificationModal({ booking, onClose, onCancelled }: CancelCertificationModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await cancelMyCertificationBooking(booking.id, reason);
      onCancelled();
      onClose();
    } catch (e) {
      setError(formatApiErrorMessage(e, "Could not cancel this booking."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} className="w-full max-w-md">
      <div className="w-full p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cancel certification booking?</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{booking.readableId}</span>
          {" · "}
          {booking.examTitle}
        </p>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          You can cancel while payment is pending or under review. After payment is approved or a voucher is issued,
          cancellation is no longer available.
        </p>
        <label className="mt-4 block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Reason (optional)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Changed my mind"
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Keep booking
          </Button>
          <Button
            disabled={submitting}
            className="border border-rose-200 bg-rose-600 text-white shadow-sm hover:bg-rose-700"
            onClick={() => void handleConfirm()}
          >
            {submitting ? "Cancelling…" : "Cancel booking"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type BookingPaymentModalProps = {
  bookingId: string;
  onClose: () => void;
  onPaid: () => void;
  onCancelled: () => void;
};

function BookingPaymentModal({ bookingId, onClose, onPaid, onCancelled }: BookingPaymentModalProps) {
  const [detail, setDetail] = useState<CertificationBookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<CertificationPaymentMethod>("bkash");
  const [trxId, setTrxId] = useState("");
  const [payerNumber, setPayerNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPaymentPolicy, setShowPaymentPolicy] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyCertificationBooking(bookingId);
      setDetail(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load booking details.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  async function handlePay() {
    if (!detail) return;
    if (!trxId.trim() || !payerNumber.trim()) {
      setMessage("Enter transaction ID and payer number.");
      return;
    }
    if (!isValidBdPhoneForCertPayment(payerNumber)) {
      setMessage("Payer number must be a valid Bangladesh mobile (+8801XXXXXXXXX), e.g. +8801712345678 or 01712345678.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await payMyCertificationBooking(detail.id, {
        paymentMethod,
        amountBdt: normalizeCertificationAmountBdt(detail.amountBdt),
        trxId: trxId.trim(),
        payerNumber: payerNumber.trim(),
      });
      setMessage("Payment submitted successfully.");
      setTrxId("");
      setPayerNumber("");
      onPaid();
      await loadDetail();
    } catch (e) {
      setMessage(formatApiErrorMessage(e, "Payment submission failed."));
    } finally {
      setSubmitting(false);
    }
  }

  const canPay = detail ? canSubmitCertificationPayment(detail.status) : false;
  const underReview = detail ? isCertificationPaymentUnderReview(detail.status) : false;
  const voucherReady = detail ? isVoucherReadyStatus(detail.status) : false;
  const showVoucher = Boolean(detail?.voucherCode?.trim()) || voucherReady;
  const canCancel = detail ? studentCertificationBookingCanCancel(detail.status) : false;

  return (
    <Modal open onClose={onClose} className="w-full max-w-3xl">
      <div className="w-full p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Certification booking details</h3>
        {loading ? <p className="mt-3 text-sm text-slate-500">Loading booking details...</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        {!loading && !error && detail ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/40 sm:grid-cols-2">
              <p>
                <span className="text-slate-500">Booking:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{detail.readableId}</span>
              </p>
              <p>
                <span className="text-slate-500">Status:</span>{" "}
                <span className="font-semibold capitalize text-slate-900 dark:text-slate-100">{toStatusLabel(detail.status)}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-slate-500">Exam:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{detail.examTitle}</span>
              </p>
              <p>
                <span className="text-slate-500">Amount:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrencyBdt(detail.amountBdt)}</span>
              </p>
              <p>
                <span className="text-slate-500">Payment deadline:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatDateTime(detail.paymentDeadlineAt)}
                </span>
              </p>
            </div>

            {showVoucher ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-800/60 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Exam voucher</p>
                {detail.voucherCode?.trim() ? (
                  <>
                    <p className="mt-2 font-mono text-lg font-bold tracking-wide text-emerald-950 dark:text-emerald-50">
                      {detail.voucherCode.trim()}
                    </p>
                    {detail.voucherNotes?.trim() ? (
                      <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">{detail.voucherNotes.trim()}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/80">
                      Save this code. You will need it to redeem your exam voucher with the provider.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                    Your payment is approved. The voucher code will appear here once our team issues it.
                  </p>
                )}
              </div>
            ) : null}

            {underReview ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-800/60 dark:bg-sky-950/30 dark:text-sky-100">
                <p className="font-semibold">Payment under review</p>
                <p className="mt-1 text-sky-800/90 dark:text-sky-200/90">
                  We received your payment{detail.paymentReferenceCode ? ` (${detail.paymentReferenceCode})` : ""}. A super
                  admin will confirm it shortly.
                </p>
              </div>
            ) : null}

            {canPay ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-900/25">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                  {detail.status.includes("reject") ? "Resubmit payment" : "Submit payment"}
                </p>
                {detail.status.includes("reject") ? (
                  <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/80">
                    Your previous payment was not approved. Enter a new transaction below.
                  </p>
                ) : null}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Payment method</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as CertificationPaymentMethod)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    >
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Amount (BDT)</span>
                    <input
                      readOnly
                      value={normalizeCertificationAmountBdt(detail.amountBdt)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Transaction ID</span>
                    <input
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="ABCD123456"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-slate-600 dark:text-slate-300">Payer number</span>
                    <input
                      value={payerNumber}
                      onChange={(e) => setPayerNumber(e.target.value)}
                      placeholder="01712345678 or +8801712345678"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                  </label>
                </div>
                <Button className="mt-3" disabled={submitting} onClick={() => setShowPaymentPolicy(true)}>
                  {submitting ? "Submitting..." : "Submit payment"}
                </Button>
              </div>
            ) : null}
            {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}

            {canCancel && detail ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 dark:border-rose-900/50 dark:bg-rose-950/25">
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">Cancel this booking</p>
                <p className="mt-1 text-xs text-rose-800/90 dark:text-rose-200/80">
                  Available before payment is approved. Submitted payments under review can also be cancelled.
                </p>
                <Button
                  size="sm"
                  className="mt-3 border border-rose-200 bg-rose-600 text-white hover:bg-rose-700"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel booking
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      {showCancelModal && detail ? (
        <CancelCertificationModal
          booking={detail}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            setShowCancelModal(false);
            onCancelled();
            onClose();
          }}
        />
      ) : null}
      <PolicyConsentModal
        open={showPaymentPolicy}
        config={CERT_PAYMENT_CONSENT}
        onClose={() => setShowPaymentPolicy(false)}
        onContinue={async () => {
          setShowPaymentPolicy(false);
          await handlePay();
        }}
        busy={submitting}
      />
    </Modal>
  );
}

export function CertificationsSection() {
  const searchParams = useSearchParams();
  const focusedBookingId = searchParams.get("bookingId");
  const focusedReadableId = searchParams.get("readableId");
  const fromBooking = searchParams.get("fromBooking") === "1";
  const [exams, setExams] = useState<CertificationExamCard[]>([]);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [examsPage, setExamsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<CertificationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  const [actionLoadingExamId, setActionLoadingExamId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(focusedBookingId);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingPolicyExamId, setBookingPolicyExamId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CertificationBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMyCertificationBookings();
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load certification bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingExams(true);
      try {
        const [vendorData, examData] = await Promise.all([
          listCertificationVendors(),
          listCertificationExams({ limit: "12", page: "1" }),
        ]);
        if (cancelled) return;
        setVendors(vendorData.map((v) => ({ id: v.id, name: v.name, slug: v.slug })));
        setExams(examData.items ?? []);
      } catch (e) {
        if (!cancelled) {
          setBookingMessage(e instanceof ApiError ? e.message : "Could not load certification catalog.");
        }
      } finally {
        if (!cancelled) setLoadingExams(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredExams = useMemo(
    () => exams.filter((exam) => (vendorFilter === "all" ? true : exam.vendor.slug === vendorFilter)),
    [exams, vendorFilter]
  );

  const examPages = Math.max(1, Math.ceil(filteredExams.length / EXAMS_PAGE_SIZE));
  const clampedExamsPage = Math.min(examsPage, examPages);
  const pagedExams = filteredExams.slice((clampedExamsPage - 1) * EXAMS_PAGE_SIZE, clampedExamsPage * EXAMS_PAGE_SIZE);

  const filteredBookings = useMemo(
    () => items.filter((item) => (statusFilter === "all" ? true : item.status === statusFilter)),
    [items, statusFilter]
  );
  const bookingPages = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PAGE_SIZE));
  const clampedBookingsPage = Math.min(bookingsPage, bookingPages);
  const pagedBookings = filteredBookings.slice(
    (clampedBookingsPage - 1) * BOOKINGS_PAGE_SIZE,
    clampedBookingsPage * BOOKINGS_PAGE_SIZE
  );

  const stats = useMemo(() => {
    const cancelledCount = items.filter((b) => b.status.includes("cancel")).length;
    const pendingPaymentCount = items.filter((b) =>
      b.status === "pending_payment" || b.status === "payment_submitted"
    ).length;
    const upcomingExamCount = items.filter((b) =>
      b.status === "payment_approved" || b.status === "voucher_issued"
    ).length;
    return [
      { label: "Total Exams Taken", value: String(items.length), trend: "All certification bookings" },
      { label: "Pending Payment", value: String(pendingPaymentCount), trend: "Awaiting payment or review" },
      { label: "Upcoming Exam", value: String(upcomingExamCount), trend: "Approved or voucher ready" },
      { label: "Canceled Exams", value: String(cancelledCount), trend: "Canceled certification bookings" },
    ];
  }, [items]);

  const bookingStatuses = useMemo(() => {
    const set = new Set(items.map((item) => item.status));
    return ["all", ...Array.from(set)];
  }, [items]);

  async function handleBookNow(examId: string) {
    setActionLoadingExamId(examId);
    setBookingMessage(null);
    try {
      const booking = await bookCertificationExam(examId);
      await listMyCertificationBookings().then((data) => setItems(data.items ?? []));
      if (booking.id) {
        setSelectedBookingId(booking.id);
      }
      setBookingMessage(
        `Booking created${booking.readableId ? ` (${booking.readableId})` : ""}. Open "View / Pay" from history to submit payment.`
      );
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Could not create booking.";
      setBookingMessage(message);
    } finally {
      setActionLoadingExamId(null);
    }
  }

  return (
    <section className="space-y-5">
      <StudentQuickStats items={stats} />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <p className="text-sm font-semibold">Certification exam history</p>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setBookingsPage(1);
            }}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            {bookingStatuses.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : toStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
        {fromBooking ? (
          <div className="m-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            Booking created{focusedReadableId ? ` (${focusedReadableId})` : ""}. Complete the payment for this exam to proceed.
          </div>
        ) : null}
        {bookingMessage ? (
          <div className="m-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300">
            {bookingMessage}
          </div>
        ) : null}
        {loading ? <p className="p-4 text-sm text-slate-500">Loading...</p> : null}
        {error ? <p className="p-4 text-sm text-rose-600">{error}</p> : null}
        {!loading && !error ? (
          filteredBookings.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                    <th className="px-4 py-2">Booking</th>
                    <th className="px-4 py-2">Exam</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBookings.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b dark:border-slate-800 ${
                        focusedBookingId === item.id
                          ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                          : "border-slate-100"
                      }`}
                    >
                      <td className="px-4 py-2">{item.readableId}</td>
                      <td className="px-4 py-2">
                        <p className="font-medium">{item.examTitle}</p>
                        <p className="text-xs text-slate-500">{item.examCode}</p>
                      </td>
                      <td className="px-4 py-2">{formatCurrencyBdt(item.amountBdt)}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full border px-2 py-1 text-xs font-semibold capitalize ${statusBadgeClass(item.status)}`}>
                          {toStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingId(item.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 text-sky-700 transition hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950/50"
                            title="View booking details"
                            aria-label={`View details for ${item.readableId}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canSubmitCertificationPayment(item.status) ? (
                            <button
                              type="button"
                              onClick={() => setSelectedBookingId(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-700 transition hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/50"
                              title="Submit payment"
                              aria-label={`Submit payment for ${item.readableId}`}
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          ) : null}
                          {studentCertificationBookingCanCancel(item.status) ? (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-700 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/50"
                              title="Cancel booking"
                              aria-label={`Cancel booking ${item.readableId}`}
                            >
                              <CircleX className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-sm text-slate-500">No certification history found for this filter.</p>
          )
        ) : null}
        {!loading && !error && filteredBookings.length > BOOKINGS_PAGE_SIZE ? (
          <Pagination
            className="px-4 py-4"
            page={clampedBookingsPage}
            totalPages={bookingPages}
            totalItems={filteredBookings.length}
            pageSize={BOOKINGS_PAGE_SIZE}
            onPageChange={setBookingsPage}
          />
        ) : null}
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Suggested certification exams</h3>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Vendor</span>
            <select
              value={vendorFilter}
              onChange={(e) => {
                setVendorFilter(e.target.value);
                setExamsPage(1);
              }}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="all">All vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.slug}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {loadingExams ? <p className="mt-4 text-sm text-slate-500">Loading exam cards...</p> : null}
        {!loadingExams && pagedExams.length ? (
          <>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedExams.map((exam) => (
                <div key={exam.id} className="space-y-2">
                  <CertificationExamCardView
                    exam={exam}
                    onBookNow={(selectedExam) => setBookingPolicyExamId(selectedExam.id)}
                    isBooking={actionLoadingExamId === exam.id}
                  />
                </div>
              ))}
            </div>
            {filteredExams.length > EXAMS_PAGE_SIZE ? (
              <Pagination
                className="mt-4"
                page={clampedExamsPage}
                totalPages={examPages}
                totalItems={filteredExams.length}
                pageSize={EXAMS_PAGE_SIZE}
                onPageChange={setExamsPage}
              />
            ) : null}
          </>
        ) : null}
        {!loadingExams && !pagedExams.length ? (
          <p className="mt-4 text-sm text-slate-500">No exams found for this vendor filter.</p>
        ) : null}
      </article>

      {selectedBookingId ? (
        <BookingPaymentModal
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onPaid={() => {
            void loadBookings();
            setBookingMessage("Payment submitted. Please wait for review confirmation.");
          }}
          onCancelled={() => {
            void loadBookings();
            setBookingMessage("Booking cancelled.");
          }}
        />
      ) : null}

      {cancelTarget ? (
        <CancelCertificationModal
          booking={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onCancelled={() => {
            void loadBookings();
            setBookingMessage(`Booking ${cancelTarget.readableId} was cancelled.`);
            setCancelTarget(null);
          }}
        />
      ) : null}

      <PolicyConsentModal
        open={Boolean(bookingPolicyExamId)}
        config={CERT_BOOKING_CONSENT}
        onClose={() => setBookingPolicyExamId(null)}
        onContinue={async () => {
          if (!bookingPolicyExamId) return;
          const examId = bookingPolicyExamId;
          setBookingPolicyExamId(null);
          await handleBookNow(examId);
        }}
        busy={Boolean(actionLoadingExamId)}
      />
    </section>
  );
}
