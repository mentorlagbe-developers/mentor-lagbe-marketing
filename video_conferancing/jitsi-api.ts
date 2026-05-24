"use client";

import { apiFetch } from "@/lib/api";

export type JitsiConferenceConfig = {
  domain: string;
  roomName: string;
  meetUrl: string;
  jwt: string | null;
  displayName: string;
  email: string;
  isModerator: boolean;
};

export async function fetchStudentJitsiConference(bookingId: string) {
  return apiFetch<JitsiConferenceConfig>(
    `/live-sessions/bookings/me/${encodeURIComponent(bookingId)}/jitsi-conference`,
    { auth: true }
  );
}

export async function fetchMentorJitsiConference(sessionId: string) {
  return apiFetch<JitsiConferenceConfig>(
    `/live-sessions/sessions/${encodeURIComponent(sessionId)}/jitsi-conference`,
    { auth: true }
  );
}
