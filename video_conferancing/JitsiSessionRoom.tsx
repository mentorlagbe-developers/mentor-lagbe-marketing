"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { JitsiConferenceConfig } from "./jitsi-api";
import { jitsiConfigOverwrite, jitsiInterfaceConfigOverwrite } from "./jitsi-config";
import { jitsiDomain } from "./jitsi-env";

const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  { ssr: false, loading: () => <p className="p-6 text-sm text-slate-500">Loading video room…</p> }
);

type JitsiSessionRoomProps = {
  conference: JitsiConferenceConfig;
  onReadyToClose?: () => void;
};

export function JitsiSessionRoom({ conference, onReadyToClose }: JitsiSessionRoomProps) {
  const domain = conference.domain || jitsiDomain();

  const userInfo = useMemo(
    () => ({
      displayName: conference.displayName,
      email: conference.email || `${conference.displayName.replace(/\s+/g, ".")}@guest.mentorlagbe.local`,
    }),
    [conference.displayName, conference.email]
  );

  return (
    <div className="h-[min(72vh,640px)] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900 dark:border-slate-700">
      <JitsiMeeting
        domain={domain}
        roomName={conference.roomName}
        jwt={conference.jwt ?? undefined}
        configOverwrite={jitsiConfigOverwrite}
        interfaceConfigOverwrite={jitsiInterfaceConfigOverwrite}
        userInfo={userInfo}
        onReadyToClose={onReadyToClose}
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
