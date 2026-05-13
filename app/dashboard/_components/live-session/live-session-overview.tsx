"use client";

import { CalendarClock, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useProfileStatus } from "@/app/dashboard/_components/profile-status-context";
import { apiFetch } from "@/lib/api";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";

type BookingRecord = {
  id: string;
  readableId: string;
  status: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  courseId?: string | null;
  customTopicName?: string | null;
  topicId?: string | null;
  topicName?: string | null;
  mentorId?: string | null;
};

function isUuidLike(value: string) {
  const normalized = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized) ||
    /^[0-9a-f]{32}$/i.test(normalized)
  );
}

function getReadableText(value?: string | null) {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized || isUuidLike(normalized)) return "";
  return normalized;
}

function getReadableSessionId(item: Record<string, unknown>) {
  const candidates = [
    item.readableId,
    item.sessionReadableId,
    item.bookingReadableId,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() && !isUuidLike(candidate.trim())) {
      return candidate.trim();
    }
  }
  return "N/A";
}

function getDirectTopicName(item: Record<string, unknown>) {
  const directCandidates = [
    item.topicName,
    item.topicTitle,
    item.subjectName,
  ];
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  if (item.topic && typeof item.topic === "object") {
    const topicRecord = item.topic as Record<string, unknown>;
    const nestedCandidates = [topicRecord.name, topicRecord.title, topicRecord.label];
    for (const candidate of nestedCandidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  return "";
}

export function LiveSessionOverview() {
  const router = useRouter();
  const { needsCompletionForLiveSession } = useProfileStatus();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad">("bkash");
  const [trxId, setTrxId] = useState("");
  const [paidPhone, setPaidPhone] = useState("");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isPaymentConfirmed] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});

  async function hydrateTopicNames(items: BookingRecord[]) {
    const courseIds = Array.from(new Set(items.map((item) => item.courseId).filter(Boolean))) as string[];
    if (!courseIds.length) {
      return;
    }
    const responses = await Promise.allSettled(
      courseIds.map((courseId) =>
        apiFetch<Array<Record<string, unknown>>>(
          `/topics?courseId=${encodeURIComponent(courseId)}`,
          { auth: true }
        )
      )
    );
    const nextTopicNames: Record<string, string> = {};
    for (const result of responses) {
      if (result.status !== "fulfilled") continue;
      for (const topic of result.value) {
        const topicId = typeof topic.id === "string" ? topic.id : "";
        const topicName =
          typeof topic.name === "string"
            ? topic.name
            : typeof topic.title === "string"
              ? topic.title
              : typeof topic.label === "string"
                ? topic.label
                : "";
        if (topicId && topicName) {
          nextTopicNames[topicId] = topicName;
        }
      }
    }
    if (Object.keys(nextTopicNames).length) {
      setTopicNames((prev) => ({ ...prev, ...nextTopicNames }));
    }
  }

  async function loadBookings() {
    try {
      const data = await apiFetch<unknown>("/live-sessions/bookings/me", { auth: true });
      let records: Record<string, unknown>[] = [];
      if (Array.isArray(data)) {
        records = data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
      } else if (data && typeof data === "object") {
        const source = data as Record<string, unknown>;
        const maybeItems = source.items ?? source.records ?? source.bookings ?? source.data;
        if (Array.isArray(maybeItems)) {
          records = maybeItems.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
        } else {
          records = [source];
        }
      }
      const normalized = records.map((item) => ({
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        readableId: getReadableSessionId(item),
        status: typeof item.status === "string" ? item.status : "unknown",
        sessionDate: typeof item.sessionDate === "string" ? item.sessionDate : "",
        startTime: typeof item.startTime === "string" ? item.startTime : "",
        endTime: typeof item.endTime === "string" ? item.endTime : "",
        durationMinutes: typeof item.durationMinutes === "number" ? item.durationMinutes : 0,
        courseId: typeof item.courseId === "string" ? item.courseId : "",
        customTopicName: typeof item.customTopicName === "string" ? item.customTopicName : "",
        topicId: typeof item.topicId === "string" ? item.topicId : "",
        topicName: getDirectTopicName(item),
        mentorId: typeof item.mentorId === "string" ? item.mentorId : "",
      }));
      setBookings(normalized);
      await hydrateTopicNames(normalized);
    } catch {
      setBookings([]);
      setTopicNames({});
    }
  }

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        void loadBookings();
      });
    });
    return () => cancelAnimationFrame(id);
    // Intentionally mount-only: load bookings once when this view mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadBookings is stable enough for mount fetch
  }, []);

  const liveSessionStats = useMemo(() => {
    const total = bookings.length;
    const cancelled = bookings.filter((item) => item.status.includes("cancel")).length;
    const upcoming = bookings.filter((item) => item.status.includes("pending") || item.status.includes("upcoming")).length;
    const completed = bookings.filter((item) => item.status.includes("completed")).length;
    const attendance = total ? `${Math.round((completed / total) * 100)}%` : "0%";
    return [
      { label: "Total Live Sessions Taken", value: String(total), trend: "Across all bookings" },
      { label: "Canceled Sessions", value: String(cancelled), trend: "Auto-synced from booking status" },
      { label: "Upcoming Sessions", value: String(upcoming), trend: "Updated from backend" },
      { label: "Attendance Rate", value: attendance, trend: "Completed vs total sessions" },
    ];
  }, [bookings]);

  const upcomingLiveSessions = useMemo(() => {
    return [...bookings]
      .filter((item) => item.status.includes("pending") || item.status.includes("upcoming"))
      .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate))
      .slice(0, 3)
      .map((item, index) => ({
        id: item.id,
        sessionReadableId: item.readableId || "N/A",
        course:
          getReadableText(item.customTopicName) ||
          getReadableText(item.topicName) ||
          getReadableText(item.topicId ? topicNames[item.topicId] : "") ||
          `Session ${index + 1}`,
        mentorId: item.mentorId || "Pending mentor assignment",
        time: `${item.sessionDate || "TBD"}, ${item.startTime.slice(0, 5)}-${item.endTime.slice(0, 5)}`,
        room: item.readableId || "N/A",
      }));
  }, [bookings, topicNames]);

  const meetingLink = "https://meet.google.com/live-demo-mentorlagbe";
  const canJoinMeeting = isPaymentConfirmed;

  function withRoleQuery(path: string) {
    if (typeof window === "undefined") {
      return path;
    }
    const query = new URLSearchParams(window.location.search);
    const role = query.get("role");
    if (!role) {
      return path;
    }
    return `${path}${path.includes("?") ? "&" : "?"}role=${role}`;
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-end">
        <Button
          disabled={needsCompletionForLiveSession}
          onClick={() => router.push(withRoleQuery("/dashboard/live-session-book"))}
          className="disabled:cursor-not-allowed disabled:opacity-60"
        >
          Book Session
        </Button>
      </div>

      {needsCompletionForLiveSession ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100">
          Live Session access is locked until you complete required profile details.
        </div>
      ) : null}

      <StudentQuickStats items={liveSessionStats} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Meeting Session Link</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              This link will be active after mentor assigns link and admin confirms your payment.
            </p>
          </div>
          {!canJoinMeeting ? (
            <Button onClick={() => setIsPaymentModalOpen(true)}>Pay Now</Button>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Assigned Link</p>
          {canJoinMeeting ? (
            <a
              href={meetingLink}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"
            >
              Open Live Meeting Link
            </a>
          ) : (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-rose-500">
                Link is disabled. Please complete payment first to enable meeting access.
              </p>
              {paymentMessage ? <p className="text-xs text-slate-500">{paymentMessage}</p> : null}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Live Session Schedule</h3>
          <button className="text-sm font-medium text-brand-primary hover:underline">Open calendar</button>
        </div>
        <div className="space-y-3">
          {upcomingLiveSessions.map((session) => (
            <article key={session.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{session.course}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Session ID: {session.sessionReadableId} • Mentor ID: {session.mentorId}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {session.time}
                  </p>
                </div>
                <button
                  disabled={needsCompletionForLiveSession}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Video className="h-3.5 w-3.5" />
                  Join Live
                </button>
              </div>
            </article>
          ))}
          {!upcomingLiveSessions.length ? (
            <p className="rounded-xl border border-slate-200 px-3 py-4 text-sm text-slate-500 dark:border-slate-700">
              No upcoming live sessions found.
            </p>
          ) : null}
        </div>
      </section>

      <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} className="h-auto max-w-xl">
        <div className="w-full p-6">
          <h3 className="text-xl font-semibold text-slate-900">Submit Payment</h3>
          <p className="mt-1 text-sm text-slate-500">Pay with bKash or Nagad and submit your transaction details.</p>

          <div className="mt-5 space-y-4">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Payment Method</span>
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as "bkash" | "nagad")}
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-brand-primary"
              >
                <option value="bkash">Pay with bKash</option>
                <option value="nagad">Pay with Nagad</option>
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">TrxID</span>
              <input
                value={trxId}
                onChange={(event) => setTrxId(event.target.value)}
                placeholder="Enter transaction ID"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-brand-primary"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Phone Number (used for payment)</span>
              <input
                value={paidPhone}
                onChange={(event) => setPaidPhone(event.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-brand-primary"
              />
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!trxId.trim() || !paidPhone.trim()) {
                  setPaymentMessage("Please provide both TrxID and payment phone number.");
                  return;
                }
                setPaymentMessage("Payment submitted. Waiting for admin confirmation to enable the meeting link.");
                setIsPaymentModalOpen(false);
                setTrxId("");
                setPaidPhone("");
                setPaymentMethod("bkash");
              }}
            >
              Submit Payment
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
