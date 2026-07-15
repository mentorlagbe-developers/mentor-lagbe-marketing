/** Audio + screen share + chat only — no camera. */
export const jitsiConfigOverwrite = {
  startWithAudioMuted: false,
  startWithVideoMuted: true,
  disableVideoMenu: true,
  startScreenSharing: false,
  prejoinPageEnabled: false,
  disableDeepLinking: true,
  /** Hide Jitsi post-meeting promo / close page inside the iframe. */
  enableClosePage: false,
  /** Avoid wait-for-host lobby on public meet.jit.si when JWT is not used. */
  enableLobby: false,
};

/** Extra embed options when the participant is the session mentor (host). */
export const jitsiMentorConfigOverwrite = {
  enableLobby: false,
  disableLobby: true,
};

export const jitsiInterfaceConfigOverwrite = {
  TOOLBAR_BUTTONS: ["microphone", "desktop", "chat", "hangup"],
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
  MOBILE_APP_PROMO: false,
};
