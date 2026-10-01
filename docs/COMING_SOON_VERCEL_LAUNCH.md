# Coming-soon mode & Vercel-only frontend

This document describes how Mentor Lagbe runs **without a backend VPS**: marketing site, one-to-one mentorship **coming soon**, interim learning on **YouTube / Facebook**, and a clean path to turn the full stack back on.

## Product goals

- Deploy the Next.js app to **Vercel** only (no Nest API host required).
- Emphasize **one-to-one live mentorship — coming soon** on the landing page.
- Offer **recorded courses** (YouTube), **free live sessions** (Facebook), and **live course** announcements.
- **Do not delete** backend integration code; disable it at documented choke points.

## FAQ: Is my API code still there?

| Layer | What happens in coming-soon mode |
|--------|----------------------------------|
| **Backend repo** | Unchanged — not part of this frontend deploy. |
| **`lib/*-api.ts` and dashboard** | Unchanged — still call `apiFetch`. |
| **Choke points** | `apiFetch`, proxy, socket, auth hydrate skip network when flags are on. |

Re-enabling is mostly **env flags + backend deploy**, not rewriting API modules.

## Environment variables

### Vercel (coming-soon production)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_COMING_SOON` | `true` |
| `COMING_SOON` | `true` |
| `NEXT_PUBLIC_YOUTUBE_URL` | Optional — full channel URL (hides YouTube CTAs if unset) |
| `NEXT_PUBLIC_FACEBOOK_URL` | Optional — full page URL (hides Facebook CTAs if unset) |
| `NEXT_PUBLIC_JITSI_ENABLED` | `false` |
| `NEXT_PUBLIC_API_URL` | `/api/v1` (optional) |
| `BACKEND_API_URL` | **Leave unset** |

### Local full stack (backend running)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_COMING_SOON` | `false` |
| `COMING_SOON` | `false` |
| `BACKEND_API_URL` | `http://127.0.0.1:3000/api/v1` |

Copy `.env.example` to `.env.local` and adjust.

## What is disabled (choke points)

Search the repo for `BACKEND_LIVE` and `isComingSoonMode`.

| File | Behavior when coming soon |
|------|---------------------------|
| [`lib/api.ts`](../lib/api.ts) | `apiFetch` throws `COMING_SOON` (no `fetch`) |
| [`lib/use-auth.ts`](../lib/use-auth.ts) | Skips `POST /auth/refresh` on load |
| [`app/api/v1/[...path]/route.ts`](../app/api/v1/[...path]/route.ts) | Proxy returns 503 |
| [`lib/notifications-context.tsx`](../lib/notifications-context.tsx) | No Socket.IO, no notification REST |
| [`proxy.ts`](../proxy.ts) | Redirects `/dashboard`, `/student`, `/admin`, `?auth=*` → `/?notice=coming-soon` (Next.js 16; was `middleware.ts`) |
| [`landing-page-shell.tsx`](../app/sections/landing/landing-page-shell.tsx) | No auth modal, no WhatsApp widget |
| [`app/certifications/page.tsx`](../app/certifications/page.tsx) | Skips catalog API fetch |

**OpenWA:** WhatsApp OTP is sent from the **backend** only. The frontend disables register/login (auth modal) and the landing **wa.me** widget in coming-soon mode. [`auth-modal.tsx`](../app/components/ui/auth-modal.tsx) is unchanged for when you re-enable.

## Landing changes

- Banner + hero copy: mentorship launching soon.
- [`interim-learning-section.tsx`](../app/sections/landing/interim-learning-section.tsx) — `#learn-now`.
- Header: **no** Login / Dashboard / Learn-now buttons (`CTA_HIDDEN` in `landing-header.tsx`).
- Footer: YouTube / Facebook from env.

## Vercel deploy checklist

1. Connect GitHub repo to Vercel.
2. Set env vars above (especially `COMING_SOON` and social URLs).
3. Deploy; open production URL.
4. Verify: `/dashboard` redirects home; Network tab shows no calls to your API host; no socket to backend.

### Local production smoke test

```bash
NEXT_PUBLIC_COMING_SOON=true COMING_SOON=true npm run build
NEXT_PUBLIC_COMING_SOON=true COMING_SOON=true npm run start
```

## Nav items temporarily hidden

In [`landing-header.tsx`](../app/sections/landing/landing-header.tsx), **Certifications** and **Become a Mentor** are commented with `NAV_HIDDEN`. Pages remain at `/certifications` and `/become-a-mentor`. Uncomment those two `navItems` lines when you want them in the header again.

## Re-enable full stack (playbook)

1. Deploy backend (VPS) with DB, env, OpenWA as before.
2. Vercel: set `NEXT_PUBLIC_COMING_SOON=false`, `COMING_SOON=false` (stops [`proxy.ts`](../proxy.ts) redirects; no file delete), and `BACKEND_API_URL` to your public API (e.g. `https://api.example.com/api/v1`).
3. Redeploy frontend.
4. Smoke test: register/login, dashboard, one booking flow, notifications socket.
5. Optional: uncomment `NAV_HIDDEN` nav links in `landing-header.tsx`.
6. Optional: WhatsApp widget and auth on landing reappear automatically when coming-soon flags are off.

If you ever fully commented live code (older approach), restore `BACKEND_LIVE` blocks in `lib/api.ts` per git history.

## Files added for this mode

- [`lib/coming-soon.ts`](../lib/coming-soon.ts)
- [`lib/social-links.ts`](../lib/social-links.ts)
- [`proxy.ts`](../proxy.ts)
- [`app/sections/landing/coming-soon-banner.tsx`](../app/sections/landing/coming-soon-banner.tsx)
- [`app/sections/landing/interim-learning-section.tsx`](../app/sections/landing/interim-learning-section.tsx)
