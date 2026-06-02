"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { fetchMentorSessions } from "@/app/dashboard/_components/mentor/mentor-session-utils";
import { fetchStudentBookingDetail } from "@/lib/live-sessions-student-api";
import {
  evaluateMeetingJoinAccess,
  meetingJoinDisabledTitle,
} from "@/lib/session-join-timing";
import {
  JitsiSessionRoom,
  fetchMentorJitsiConference,
  fetchStudentJitsiConference,
  type JitsiConferenceConfig,
} from "@/video_conferancing";

async function loadSessionJoinRecord(
  sessionId: string,
  role: "mentor" | "student",
): Promise<Record<string, unknown> | null> {
  if (role === "mentor") {
    const sessions = await fetchMentorSessions(apiFetch);
    const match = sessions.find((s) => s.id === sessionId);
    return match ? (match as unknown as Record<string, unknown>) : null;
  }
  const detail = await fetchStudentBookingDetail(sessionId);
  return {
    status: detail.status,
    sessionDate: detail.sessionDate,
    startTime: detail.startTime,
    endTime: detail.endTime,
    durationMinutes: detail.durationMinutes,
    id: detail.id,
  };
}

export default function MeetSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = String(params.sessionId ?? "");
  const role = searchParams.get("role") === "mentor" ? "mentor" : "student";

  const [conference, setConference] = useState<JitsiConferenceConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const record = await loadSessionJoinRecord(sessionId, role);
        const access = record ? evaluateMeetingJoinAccess(record) : null;
        if (!access?.canJoin) {
          if (!cancelled) {
            setError(
              access
                ? meetingJoinDisabledTitle(access)
                : "Session not found or join is unavailable.",
            );
          }
          return;
        }

        const data =
          role === "mentor"
            ? await fetchMentorJitsiConference(sessionId)
            : await fetchStudentJitsiConference(sessionId);
        if (!cancelled) setConference(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Could not load video room.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, role]);

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Live session</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audio, screen share, and chat only (camera off).
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {loading ? <p className="text-sm text-slate-500">Preparing room…</p> : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
          <div className="mt-3">
            <Link href="/dashboard" className="text-sm font-medium underline">
              Return to dashboard
            </Link>
          </div>
        </div>
      ) : null}

      {conference ? (
        <JitsiSessionRoom
          conference={conference}
          onReadyToClose={() => router.push("/dashboard")}
        />
      ) : null}
    </div>
  );
}
