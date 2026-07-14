"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { JoinMeetingButton } from "@/app/components/ui/join-meeting-button";
import { ApiError } from "@/lib/api";
import {
  joinAccessShowsPaymentCountdown,
  joinAccessShowsPaymentForm,
  studentBookingCanCancel,
  type JoinAccessState,
} from "@/lib/join-access";
import {
  cancelStudentBooking,
  fetchStudentBookingDetail,
  joinBookingSession,
  submitBookingPayment,
  type StudentBookingDetail,
} from "@/lib/live-sessions-student-api";
import { cn } from "@/lib/utils";
import { meetingJoinDisabledTitle, useMeetingJoinAccess } from "@/lib/session-join-timing";

type BookingDetailPanelProps = {
  bookingId: string;
  topicLabel?: string;
  onClose?: () => void;
  onUpdated?: () => void;
  className?: string;
};

function formatTime12(raw: string | undefined) {
  if (!raw?.trim()) return "";
  const normalized = raw.trim().slice(0, 5);
  const [hourText, minuteText] = normalized.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return normalized;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function formatTimeRange(start?: string, end?: string) {
  const startLabel = formatTime12(start);
  const endLabel = formatTime12(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel || "—";
}

function formatCountdown(deadlineIso: string | null | undefined) {
  if (!deadlineIso) return null;
  const ms = new Date(deadlineIso).getTime() - Date.now();
  if (ms <= 0) return "Payment window closed";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h > 0) return `${h}h ${min}m left to pay`;
  return `${min}m left to pay`;
}

function stateBadgeClass(state: JoinAccessState) {
  if (state === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (state === "payment_required" || state === "payment_rejected") return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (state === "payment_under_review") return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-300";
  return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

export function BookingDetailPanel({
  bookingId,
  topicLabel,
  onClose,
  onUpdated,
  className,
}: BookingDetailPanelProps) {
  const [detail, setDetail] = useState<StudentBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad">("bkash");
  const [trxId, setTrxId] = useState("");
  const [payerNumber, setPayerNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchStudentBookingDetail(bookingId);
      setDetail(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load booking.");
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const joinAccess = detail?.joinAccess;
  const joinWindowRecord = useMemo(
    () =>
      detail
        ? ({
            status: detail.status,
            sessionDate: detail.sessionDate,
            startTime: detail.startTime,
            endTime: detail.endTime,
            durationMinutes: detail.durationMinutes,
            id: detail.id,
          } satisfies Record<string, unknown>)
        : null,
    [detail],
  );
  const joinWindow = useMeetingJoinAccess(joinWindowRecord);
  const countdown = useMemo(
    () => formatCountdown(detail?.paymentDeadlineAt),
    [detail?.paymentDeadlineAt]
  );

  async function handlePaymentSubmit() {
    if (!detail) return;
    if (!trxId.trim() || !payerNumber.trim()) {
      setActionMessage("Enter TrxID and the phone number used for payment.");
      return;
    }
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      await submitBookingPayment(detail.id, {
        paymentMethod,
        trxId: trxId.trim(),
        payerNumber: payerNumber.trim(),
        amountBdt: detail.priceBdt,
      });
      setTrxId("");
      setPayerNumber("");
      await load();
      onUpdated?.();
      setActionMessage("Payment submitted. We will notify you on WhatsApp when it is reviewed.");
    } catch (e) {
      setActionMessage(e instanceof ApiError ? e.message : "Payment submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const resolveMeetingUrl = useCallback(async () => {
    if (!detail?.joinAccess?.canJoin || !joinWindow.canJoin) return null;
    const res = await joinBookingSession(detail.id);
    return res.meetLink?.trim() ?? null;
  }, [detail, joinWindow.canJoin]);

  async function handleCancel() {
    if (!detail) return;
    const reason = window.prompt("Cancellation reason (optional):") ?? "";
    setIsSubmitting(true);
    try {
      await cancelStudentBooking(detail.id, reason);
      await load();
      onUpdated?.();
    } catch (e) {
      setActionMessage(e instanceof ApiError ? e.message : "Could not cancel booking.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className={cn("text-sm text-slate-500", className)}>Loading session…</p>;
  }
  if (error) {
    return <p className={cn("text-sm text-rose-500", className)}>{error}</p>;
  }
  if (!detail) return null;

  const showPaymentForm = joinAccess && joinAccessShowsPaymentForm(joinAccess.state);
  const canCancelBooking = studentBookingCanCancel({
    status: detail.status,
    joinAccessState: joinAccess?.state,
    joinBlockReason: joinWindow.reason,
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Session</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{detail.readableId}</p>
          {topicLabel ? <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{topicLabel}</p> : null}
        </div>
        {joinAccess ? (
          <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", stateBadgeClass(joinAccess.state))}>
            {joinAccess.state.replace(/_/g, " ")}
          </span>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase text-slate-400">Date</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-100">{detail.sessionDate || "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-slate-400">Time</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-100">
            {formatTimeRange(detail.startTime, detail.endTime)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-slate-400">Amount</dt>
          <dd className="font-medium text-slate-800 dark:text-slate-100">৳{detail.priceBdt}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-slate-400">Mentor</dt>
          <dd className="truncate font-medium text-slate-800 dark:text-slate-100" title={detail.mentorName}>
            {detail.mentorName || detail.mentorReadableId || "—"}
          </dd>
        </div>
      </dl>

      {joinAccess?.message ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
          {joinAccess.message}
          {countdown && joinAccessShowsPaymentCountdown(joinAccess.state) ? (
            <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-300">{countdown}</span>
          ) : null}
        </p>
      ) : null}

      {joinAccess?.rejectionReason ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Rejection reason: {joinAccess.rejectionReason}
        </p>
      ) : null}

      {showPaymentForm ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Submit payment</p>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/80">
            Pay with bKash or Nagad. We will also notify you on WhatsApp when your payment is confirmed.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm sm:col-span-3">
              <span className="font-medium text-slate-700 dark:text-slate-300">Method</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "bkash" | "nagad")}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">TrxID</span>
              <input
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                placeholder="Transaction ID"
              />
            </label>
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">Payer number</span>
              <input
                value={payerNumber}
                onChange={(e) => setPayerNumber(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                placeholder="+8801XXXXXXXXX"
              />
            </label>
          </div>
          <Button className="mt-3" disabled={isSubmitting} onClick={() => void handlePaymentSubmit()}>
            {isSubmitting ? "Submitting…" : "Submit payment"}
          </Button>
        </div>
      ) : null}

      {joinAccess?.canJoin ? (
        <JoinMeetingButton
          resolveMeetingUrl={resolveMeetingUrl}
          inAppSessionId={detail.id}
          meetRole="student"
          variant="full"
          disabled={!joinWindow.canJoin}
          disabledTitle={meetingJoinDisabledTitle(joinWindow)}
        />
      ) : joinWindow.reason === "after_end" || joinWindow.reason === "terminal_status" ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {meetingJoinDisabledTitle(joinWindow)}
        </p>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Join unlocks at session time after payment is approved. You will review a privacy notice before entering the room.
        </p>
      )}

      {actionMessage ? <p className="text-sm text-slate-600 dark:text-slate-300">{actionMessage}</p> : null}

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
        {canCancelBooking ? (
          <Button variant="secondary" size="sm" disabled={isSubmitting} onClick={() => void handleCancel()}>
            Cancel booking
          </Button>
        ) : null}
        {onClose ? (
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>
    </div>
  );
}
