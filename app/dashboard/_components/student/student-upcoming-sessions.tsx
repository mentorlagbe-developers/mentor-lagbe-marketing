"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useNotifications } from "@/lib/notifications-context";
import { JoinMeetingButton } from "@/app/components/ui/join-meeting-button";

type RawBooking = Record<string, unknown>;

function to12h(raw: string): string {
  if (!raw) return "—";
  const [h, m] = raw.slice(0, 5).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return raw.slice(0, 5);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function getString(item: RawBooking, key: string): string {
  return typeof item[key] === "string" ? (item[key] as string) : "";
}

function getTopicName(item: RawBooking): string {
  for (const key of ["customTopicName", "topicName", "topicTitle", "courseName", "subjectName"]) {
    const v = getString(item, key);
    if (v && !/^[0-9a-f-]{32,}$/i.test(v)) return v;
  }
  return "Live Session";
}

function getReadableId(item: RawBooking): string {
  for (const key of ["readableId", "sessionReadableId", "bookingReadableId"]) {
    const v = getString(item, key);
    if (v && !/^[0-9a-f-]{32,}$/i.test(v)) return v;
  }
  return "—";
}

type SessionRow = {
  id: string;
  readableId: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  meetLink: string;
};

export function StudentUpcomingSessions() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sessionAcceptedAt } = useNotifications();
  const isFirstMount = useRef(true);

  async function load() {
    setIsLoading(true);
    try {
      const raw = await apiFetch<unknown>("/live-sessions/bookings/me", { auth: true });
      let records: RawBooking[] = [];
      if (Array.isArray(raw)) {
        records = raw.filter((x): x is RawBooking => Boolean(x && typeof x === "object"));
      } else if (raw && typeof raw === "object") {
        const src = raw as RawBooking;
        const inner = src.items ?? src.bookings ?? src.data ?? src.records;
        if (Array.isArray(inner)) {
          records = inner.filter((x): x is RawBooking => Boolean(x && typeof x === "object"));
        }
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const next = records
        .filter((item) => {
          const s = getString(item, "status").toLowerCase();
          const date = getString(item, "sessionDate");
          return (
            date >= todayStr &&
            (s.includes("accepted") || s.includes("confirmed") || s.includes("scheduled"))
          );
        })
        .sort((a, b) =>
          getString(a, "sessionDate").localeCompare(getString(b, "sessionDate"))
        )
        .map((item) => ({
          id: getString(item, "id") || String(Math.random()),
          readableId: getReadableId(item),
          topic: getTopicName(item),
          date: getString(item, "sessionDate"),
          startTime: getString(item, "startTime"),
          endTime: getString(item, "endTime"),
          meetLink: getString(item, "meetLink") || getString(item, "meet_link"),
        }));

      setRows(next);
    } catch {
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Mount fetch
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      startTransition(() => {
        load().catch(() => setIsLoading(false));
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only fetch
  }, []);

  // Auto-refresh when mentor accepts
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (sessionAcceptedAt === 0) return;
    startTransition(() => {
      load().catch(() => setIsLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionAcceptedAt]);

  const isEmpty = !isLoading && rows.length === 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Sessions</h3>
        <button
          type="button"
          onClick={() => { startTransition(() => { load().catch(() => setIsLoading(false)); }); }}
          disabled={isLoading}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CalendarClock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No upcoming sessions</p>
          <p className="text-xs text-slate-400">
            Sessions appear here once a mentor accepts your request.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{item.topic}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.readableId}
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    {item.date} · {to12h(item.startTime)} – {to12h(item.endTime)}
                  </p>
                </div>

                {item.meetLink?.trim() ? (
                  <JoinMeetingButton href={item.meetLink} variant="compact" />
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    Upcoming
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
