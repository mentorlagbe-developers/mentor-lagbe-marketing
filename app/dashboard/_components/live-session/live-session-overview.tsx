"use client";

import { CalendarClock, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Button } from "@/app/components/ui/button";
import { Modal } from "@/app/components/ui/modal";

const liveSessionStats = [
  { label: "Total Live Sessions Taken", value: "42", trend: "Across this semester" },
  { label: "Canceled Sessions", value: "3", trend: "Down 1 from last month" },
  { label: "Upcoming Sessions", value: "5", trend: "Next starts in 1h 20m" },
  { label: "Attendance Rate", value: "91%", trend: "Above cohort average" },
];

const upcomingLiveSessions = [
  { id: "LS-1204", course: "CSE220 - Data Structures", mentorId: "MTR-2041", time: "Today, 8:00 PM", room: "Room A-12" },
  { id: "LS-1207", course: "BBA210 - Financial Management", mentorId: "MTR-3198", time: "Tomorrow, 6:30 PM", room: "Room B-05" },
  { id: "LS-1211", course: "CSE310 - Operating Systems", mentorId: "MTR-1187", time: "Sat, 9:00 PM", room: "Room C-03" },
];

export function LiveSessionOverview() {
  const router = useRouter();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad">("bkash");
  const [trxId, setTrxId] = useState("");
  const [paidPhone, setPaidPhone] = useState("");
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [isPaymentConfirmed] = useState(false);

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
        <Button onClick={() => router.push(withRoleQuery("/dashboard/live-session-book"))}>Book Session</Button>
      </div>

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
                    Session ID: {session.id} • Mentor ID: {session.mentorId}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {session.time}
                  </p>
                </div>
                <button className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-secondary">
                  <Video className="h-3.5 w-3.5" />
                  Join Live
                </button>
              </div>
            </article>
          ))}
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
