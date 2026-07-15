"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import type { JitsiConferenceConfig } from "./jitsi-api";
import {
  jitsiConfigOverwrite,
  jitsiInterfaceConfigOverwrite,
  jitsiMentorConfigOverwrite,
} from "./jitsi-config";
import { jitsiDomain } from "./jitsi-env";
import { SessionEndedPanel } from "./SessionEndedPanel";

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false, loading: () => <p className="p-6 text-sm text-slate-500">Loading video room…</p> }
);

type JitsiSessionRoomProps = {
  conference: JitsiConferenceConfig;
  onMeetingEnd?: () => void;
  onReturnToDashboard?: () => void;
};

export function JitsiSessionRoom({
  conference,
  onMeetingEnd,
  onReturnToDashboard,
}: JitsiSessionRoomProps) {
  const [ended, setEnded] = useState(false);
  const domain = conference.domain || jitsiDomain();

  const userInfo = useMemo(
    () => ({
      displayName: conference.displayName,
      email: conference.email || `${conference.displayName.replace(/\s+/g, ".")}@guest.mentorlagbe.local`,
    }),
    [conference.displayName, conference.email]
  );

  const configOverwrite = useMemo(
    () => ({
      ...jitsiConfigOverwrite,
      ...(conference.isModerator ? jitsiMentorConfigOverwrite : {}),
    }),
    [conference.isModerator]
  );

  const handleMeetingEnd = useCallback(() => {
    setEnded(true);
    onMeetingEnd?.();
  }, [onMeetingEnd]);

  if (ended) {
    return <SessionEndedPanel onReturn={onReturnToDashboard} />;
  }

  return (
    <div className="h-[min(72vh,640px)] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 dark:border-slate-700">
      <JitsiMeeting
        domain={domain}
        roomName={conference.roomName}
        jwt={conference.jwt ?? undefined}
        configOverwrite={configOverwrite}
        interfaceConfigOverwrite={jitsiInterfaceConfigOverwrite}
        userInfo={userInfo}
        onReadyToClose={handleMeetingEnd}
        onApiReady={(externalApi) => {
          externalApi.addListener("videoConferenceLeft", handleMeetingEnd);
        }}
        getIFrameRef={(iframe) => {
          if (iframe) {
            iframe.style.height = "100%";
            iframe.style.width = "100%";
            iframe.style.minHeight = "480px";
          }
        }}
      />
    </div>
  );
}
