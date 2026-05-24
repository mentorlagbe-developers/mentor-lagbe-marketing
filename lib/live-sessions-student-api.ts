"use client";

import { apiFetch } from "@/lib/api";
import { parseJoinAccess, type JoinAccess } from "@/lib/join-access";

export type StudentBookingDetail = {
  id: string;
  readableId: string;
  status: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  priceBdt: string;
  customTopicName?: string;
  problemDescription?: string;
  mentorId?: string;
  mentorReadableId?: string;
  mentorName?: string;
  meetLink?: string;
  paymentDeadlineAt?: string | null;
  minutesLeftToPay?: number | null;
  joinAccess: JoinAccess | null;
};

function str(v: unknown, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback = 0) {
  return typeof v === "number" ? v : fallback;
}

export function parseStudentBookingDetail(raw: Record<string, unknown>): StudentBookingDetail {
  const mentor =
    raw.mentor && typeof raw.mentor === "object"
      ? (raw.mentor as Record<string, unknown>)
      : null;

  return {
    id: str(raw.id, crypto.randomUUID()),
    readableId:
      str(raw.readableId) ||
      str(raw.sessionReadableId) ||
      str(raw.bookingReadableId) ||
      "N/A",
    status: str(raw.status, "unknown"),
    sessionDate: str(raw.sessionDate),
    startTime: str(raw.startTime),
    endTime: str(raw.endTime),
    durationMinutes: num(raw.durationMinutes),
    priceBdt: str(raw.priceBdt, "0"),
    customTopicName: str(raw.customTopicName),
    problemDescription: str(raw.problemDescription),
    mentorId: str(raw.mentorId) || str(mentor?.id),
    mentorReadableId:
      str(raw.mentorReadableId) ||
      str(mentor?.readableId) ||
      str(mentor?.mentorReadableId),
    mentorName:
      str(raw.mentorName) ||
      str(mentor?.fullName) ||
      str(mentor?.name),
    meetLink: str(raw.meetLink) || str(raw.meet_link),
    paymentDeadlineAt:
      str(raw.paymentDeadlineAt) || str(raw.payment_deadline_at) || null,
    minutesLeftToPay:
      typeof raw.minutesLeftToPay === "number"
        ? raw.minutesLeftToPay
        : typeof raw.minutes_left_to_pay === "number"
          ? raw.minutes_left_to_pay
          : null,
    joinAccess: parseJoinAccess(raw.joinAccess ?? raw.join_access),
  };
}

export async function fetchStudentBookingDetail(bookingId: string) {
  const raw = await apiFetch<Record<string, unknown>>(
    `/live-sessions/bookings/me/${encodeURIComponent(bookingId)}`,
    { auth: true }
  );
  return parseStudentBookingDetail(raw);
}

export async function submitBookingPayment(
  bookingId: string,
  payload: {
    paymentMethod: "bkash" | "nagad";
    trxId: string;
    payerNumber: string;
    amountBdt: string | number;
  }
) {
  return apiFetch<Record<string, unknown>>(
    `/live-sessions/bookings/me/${encodeURIComponent(bookingId)}/payment`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    }
  );
}

export async function joinBookingSession(bookingId: string) {
  return apiFetch<{ meetLink?: string }>(
    `/live-sessions/bookings/me/${encodeURIComponent(bookingId)}/join`,
    { method: "POST", auth: true }
  );
}

export async function cancelStudentBooking(bookingId: string, cancellationReason?: string) {
  return apiFetch<Record<string, unknown>>(
    `/live-sessions/bookings/me/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(
        cancellationReason?.trim() ? { cancellationReason: cancellationReason.trim() } : {}
      ),
    }
  );
}
