import { CalendarCheck2 } from "lucide-react";
import { useState } from "react";

type UpcomingSessionItem = {
  id: string;
  title: string;
  mentorId: string;
  time: string;
  status: "upcoming" | "joined";
};

const initialSessions: UpcomingSessionItem[] = [
  { id: "sess-901", title: "CSE - Data Structures (Trees)", mentorId: "MTR-2041", time: "Today, 7:30 PM", status: "upcoming" },
  { id: "sess-902", title: "BBA - Financial Accounting", mentorId: "MTR-3198", time: "Tomorrow, 6:00 PM", status: "upcoming" },
  { id: "sess-903", title: "CSE - DBMS Query Optimization", mentorId: "MTR-1187", time: "Sat, 9:00 PM", status: "joined" },
];

type StudentUpcomingSessionsProps = {
  initialData?: UpcomingSessionItem[];
};

export function StudentUpcomingSessions({ initialData = initialSessions }: StudentUpcomingSessionsProps) {
  const [sessions, setSessions] = useState(initialData);

  function markJoined(sessionId: string) {
    setSessions((current) =>
      current.map((item) => (item.id === sessionId ? { ...item, status: "joined" } : item))
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Sessions</h3>
        <button className="text-sm font-medium text-brand-primary hover:underline">View all</button>
      </div>
      <div className="space-y-3">
        {sessions.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mentor ID: {item.mentorId} • {item.time}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  item.status === "joined"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                }`}
              >
                {item.status === "joined" ? "Joined" : "Upcoming"}
              </span>
              {item.status === "upcoming" ? (
                <button
                  type="button"
                  onClick={() => markJoined(item.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-secondary"
                >
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Join
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
