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
  WaitingForMentorPanel,
  announceMentorJitsiPresence,
  fetchMentorJitsiConference,
  fetchStudentJitsiConference,
  fetchStudentJitsiMentorPresence,
  type JitsiConferenceConfig,
} from "@/video_conferancing";
import { isPublicJitsiDomain } from "@/video_conferancing/jitsi-env";

const PRESENCE_POLL_MS = 3000;

function meetPageNotice(conference: JitsiConferenceConfig): string | null {
  const domain = conference.domain || "";
  const onPublic = isPublicJitsiDomain(domain);

  if (conference.isModerator && !conference.jwt && onPublic) {
    return "Join before the student to start the room. On meet.jit.si the first person in the room becomes the host.";
  }

  if (conference.isModerator && !conference.jwt && !onPublic) {
    return "Video server requires JWT for moderator access. Set JITSI_USE_JWT=true and matching keys on the API, then reload.";
  }

  return null;
}

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
  const [mentorReady, setMentorReady] = useState(role === "mentor");

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      setMentorReady(role === "mentor");
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

  useEffect(() => {
    if (!conference || role !== "mentor" || !isPublicJitsiDomain(conference.domain)) return;
    void announceMentorJitsiPresence(sessionId).catch(() => undefined);
  }, [conference, role, sessionId]);

  useEffect(() => {
    if (!conference || role !== "student" || !isPublicJitsiDomain(conference.domain)) {
      setMentorReady(role === "mentor");
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const snap = await fetchStudentJitsiMentorPresence(sessionId);
        if (!cancelled) setMentorReady(snap.mentorReady);
      } catch {
        if (!cancelled) setMentorReady(false);
      }
    };

    void poll();
    const id = window.setInterval(poll, PRESENCE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [conference, role, sessionId]);

  const showEmbed =
    conference &&
    (role === "mentor" || mentorReady || !isPublicJitsiDomain(conference.domain));

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
        <>
          {(() => {
            const notice = meetPageNotice(conference);
            const blockEmbed =
              conference.isModerator &&
              !conference.jwt &&
              !isPublicJitsiDomain(conference.domain);

            if (blockEmbed && notice) {
              return (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
                  {notice}
                </div>
              );
            }

            return (
              <>
                {notice && showEmbed ? (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100">
                    {notice}
                  </div>
                ) : null}
                {showEmbed ? (
                  <JitsiSessionRoom
                    conference={conference}
                    onReturnToDashboard={() => router.push("/dashboard")}
                  />
                ) : (
                  <WaitingForMentorPanel />
                )}
              </>
            );
          })()}
        </>
      ) : null}
    </div>
  );
}
