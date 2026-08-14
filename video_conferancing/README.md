# Video conferencing (Jitsi)

All Jitsi UI and client helpers live here. See backend `video_conferancing.md` for env vars and API routes.

**Inactive by default** — production uses manual Google Meet links (`NEXT_PUBLIC_JITSI_ENABLED=false`). Set the flag `true` to enable in-app rooms.

- **Meet page:** `app/dashboard/meet/[sessionId]/page.tsx`
- **Join:** `JoinMeetingButton` routes in-app when `NEXT_PUBLIC_JITSI_ENABLED=true` and `inAppSessionId` is set; otherwise opens the stored Google Meet URL in a new tab.
