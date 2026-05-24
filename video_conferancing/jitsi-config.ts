/** Audio + screen share + chat only — no camera. */
export const jitsiConfigOverwrite = {
  startWithAudioMuted: false,
  startWithVideoMuted: true,
  disableVideoMenu: true,
  startScreenSharing: false,
  prejoinPageEnabled: false,
  disableDeepLinking: true,
};

export const jitsiInterfaceConfigOverwrite = {
  TOOLBAR_BUTTONS: ["microphone", "desktop", "chat", "hangup"],
  SHOW_JITSI_WATERMARK: false,
  SHOW_WATERMARK_FOR_GUESTS: false,
  DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
  MOBILE_APP_PROMO: false,
};
