# Mentor Lagbe Frontend — Agent Guide

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
| Jitsi meet room | [`video_conferancing/`](video_conferancing/) · `/dashboard/meet/[sessionId]` |

## Jitsi (meet page)

- Public `meet.jit.si`: mentor joins first (`POST .../jitsi-presence`); student polls `GET .../jitsi-presence` before embed.
- On hangup: iframe unmounts → [`SessionEndedPanel`](video_conferancing/SessionEndedPanel.tsx) (no 8x8 promo).
- Config: [`jitsi-config.ts`](video_conferancing/jitsi-config.ts) — lobby off, camera off, `enableClosePage: false`.

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
