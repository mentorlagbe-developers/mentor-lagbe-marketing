"use client";

import { CalendarClock, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { StudentQuickStats } from "@/app/dashboard/_components/student/student-quick-stats";
import { Button } from "@/app/components/ui/button";

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
    </section>
  );
}
