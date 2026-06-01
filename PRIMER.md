# Fork — Session Primer

> Claude rewrites this file at the end of every session.
> Read this first at the start of every session before doing anything else.

---

## Last Updated

2026-06-01 (Seth + Claude) — **Hooks extraction + saved favorites complete. Build passes clean.**

---

## What Just Happened

### Session 1: Monolith Decomposition (COMPLETE)

Broke up the 2,312-line `page.tsx` monolith into 20 files: 3 shared libs, 3 shared components, 13 screen components. `page.tsx` went from 2,312 to 778 lines.

### Session 1 (continued): Hooks Extraction + Favorites (COMPLETE)

Extracted state from `page.tsx` into 6 custom hooks:

- `lib/hooks/useGeolocation.ts` — GPS detection, coords, cityIn
- `lib/hooks/useFavorites.ts` — localStorage-backed save/remove/check
- `lib/hooks/useForkDrop.ts` — active drop fetching, claims, countdown
- `lib/hooks/useRoulette.ts` — spin state, eligibility, prizes
- `lib/hooks/useSwipe.ts` — drag state, direction, hint dismissal
- `lib/hooks/useGroupSession.ts` — all group mode state + Supabase realtime

Added **saved favorites** feature:
- Swipe right auto-saves restaurant to favorites
- Heart icon with count badge on home screen
- New `FavoritesScreen` with order/remove actions
- Persisted in localStorage (`fork_favorites`)

Deleted dead `lib/preferenceMapper.ts`.

`page.tsx` is now ~310 lines — hooks + screen routing only.

---

## What Is Complete

- Location input with GPS auto-detect (Nominatim reverse geocoding)
- 2-question vibe quiz + drinks sub-flow
- Yelp API integration with NYC neighborhood strict filtering
- Tinder-style card swiping (touch + mouse)
- Delivery modal (Uber Eats, DoorDash, Grubhub, Postmates, Seamless)
- Reservation modal (OpenTable, Resy, Yelp)
- Group voting via Supabase Realtime (create/join/vote/consensus)
- Fork Roulette (monthly spin-to-win)
- Fork Drops (time-limited promotions)
- Lottery entry tracking (device-based)
- Component decomposition into 20+ files
- Custom hooks extraction (6 hooks)
- Saved favorites with localStorage persistence

---

## What Is NOT Built Yet

- **User accounts / auth** — all anonymous, device ID only
- **Admin dashboard** — no panel for managing drops, prizes, lottery
- **Prize redemption flow** — roulette just says "we'll email you"
- **Analytics / event tracking** — no usage metrics
- **Email notifications** — no Resend/SendGrid integration
- **Rate limiting** — Yelp API calls unthrottled
- **Result caching** — re-rolls re-fetch from Yelp every time

---

## Known Issues

1. Group voting requires unanimous consensus — no fallback for stalled votes
2. Group code generation uses `Math.random()` — not cryptographically secure
3. Device ID forgeable via localStorage clear
4. Roulette prize info is hardcoded in the UI ("Tasting Menu for Two") even though DB prizes may differ

---

## Repo & Deployment

- **GitHub:** https://github.com/sethjfried-cloud/Fork
- **Hosting:** Vercel (connected to GitHub, auto-deploys on push)
- **Env vars:** Set in Vercel dashboard (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `YELP_API_KEY`)
