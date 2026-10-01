# Mentor Lagbe Frontend — Agent Guide

## Coming-soon / Vercel-only mode

When `NEXT_PUBLIC_COMING_SOON=true` and `COMING_SOON=true`, the frontend does not call the API or open Socket.IO; dashboard routes redirect home. See [`docs/COMING_SOON_VERCEL_LAUNCH.md`](docs/COMING_SOON_VERCEL_LAUNCH.md).

## Stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**
- API: `apiFetch` from [`lib/api.ts`](lib/api.ts) — `{ success, data }` envelope
- WebSocket: `io("<host>/notifications", { auth: { token } })` — see [`lib/notifications-context.tsx`](lib/notifications-context.tsx)
- WhatsApp is **backend-only** (OpenWA). Frontend never sends WA messages.

## Conventions

- Match dashboard patterns: `StudentQuickStats`, `Pagination`, `Modal`, `Button`
- Student meet links: use `joinAccess` + `POST .../join` — never show `meetLink` from list/detail unless `joinAccess.canJoin === true`
- Mentor APIs may include `meetLink` directly

## Integration status (Payment & notifications)

| Area | Status | Notes |
|------|--------|--------|
| Register + WhatsApp OTP | Done | `phone`, `whatsappOptIn`, verify panel, 180s resend |
| `joinAccess` + payment form | Done | [`booking-detail-panel.tsx`](app/dashboard/_components/bookings/booking-detail-panel.tsx) |
| `POST .../payment`, `POST .../join` | Done | [`lib/live-sessions-student-api.ts`](lib/live-sessions-student-api.ts) |
| Socket: accepted, payment_*, expired, meet_link_updated | Done | [`notifications-context.tsx`](lib/notifications-context.tsx) |
| Mentor heartbeat (60s) | Done | Emitted when `role === "teacher"` |
| Notifications REST + mark read | Done | Was partial; now parses `unreadCount` |
| Admin pending payments | Done | `/dashboard/admin-payments` (superadmin) |
| Student Payments page (history) | Done | [`lib/student-payments-api.ts`](lib/student-payments-api.ts) · `GET /payments/me` |
| Bookings list pagination query | Partial | `GET .../bookings/me` without `page`/`status` params yet |
| Mentor cancel session | Not done | `POST .../sessions/:id/cancel` |
| Token refresh → socket reconnect | Not done | Manual reconnect on remount only |

## Key files

| Feature | File |
|---------|------|
| Join access types | [`lib/join-access.ts`](lib/join-access.ts) |
| Student booking APIs | [`lib/live-sessions-student-api.ts`](lib/live-sessions-student-api.ts) |
| Booking detail UI | [`app/dashboard/_components/bookings/booking-detail-panel.tsx`](app/dashboard/_components/bookings/booking-detail-panel.tsx) |
| Live session payment block | [`live-session-overview.tsx`](app/dashboard/_components/live-session/live-session-overview.tsx) |
| Admin payments | [`admin-payments-panel.tsx`](app/dashboard/_components/admin/admin-payments-panel.tsx) |
| Manual Google Meet (mentor) | [`mentor-session-requests.tsx`](app/dashboard/_components/mentor/mentor-session-requests.tsx) · accept + [`mentor-dashboard-overview.tsx`](app/dashboard/_components/mentor/mentor-dashboard-overview.tsx) · edit |
| Jitsi meet room (optional) | [`video_conferancing/`](video_conferancing/) · inactive when `NEXT_PUBLIC_JITSI_ENABLED=false` |

## Video / meet links

**Active mode:** manual Google Meet — mentor pastes link on accept (`POST .../accept` `{ meetLink }`) and can edit via `PATCH .../sessions/:id/meet-link`.

**Env:** `NEXT_PUBLIC_JITSI_ENABLED=false` (frontend) and `JITSI_ENABLED=false` (backend).

**Jitsi (dormant):** Set both flags `true` to use in-app `/dashboard/meet/[sessionId]` instead of external Google Meet tabs.

## Dashboard routes (student)

| Section | Component |
|---------|-----------|
| `live-session` | `LiveSessionOverview` — payment via `BookingDetailPanel` |
| `bookings` | `BookingsSection` — full `joinAccess` in detail modal |
| `payments` | `PaymentsSection` — mock history |
| `help-center` | `HelpCenterSection` |

## API quick reference

- Register: `POST /auth/register` `{ phone, whatsappOptIn, ... }`
- Verify: `POST /auth/verify-email` `{ userId, otp }`
- Booking detail: `GET /live-sessions/bookings/me/:id` → `joinAccess`
- Pay: `POST /live-sessions/bookings/me/:id/payment`
- Join: `POST /live-sessions/bookings/me/:id/join` → `{ meetLink }`
- Admin: `GET /admin/payments/pending`, `POST .../approve`, `POST .../reject`
