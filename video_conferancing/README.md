# Video conferencing (Jitsi)

All Jitsi UI and client helpers live here. See backend `video_conferancing.md` for env vars and API routes.

- **Meet page:** `app/dashboard/meet/[sessionId]/page.tsx`
- **Join:** `JoinMeetingButton` routes in-app when `NEXT_PUBLIC_JITSI_ENABLED=true` and `inAppSessionId` is set.
