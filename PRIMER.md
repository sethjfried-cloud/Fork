# Fork — Session Primer

> Claude rewrites this file at the end of every session.
> Read this first at the start of every session before doing anything else.

---

## Last Updated

2026-06-01 (Seth + Claude) — **Result caching, rate limiting, group vote fallback, and no-more favorites prompt shipped.**

---

## What Just Happened (Session 1)

### Monolith Decomposition
Broke up the 2,312-line `page.tsx` monolith into 20+ files. `page.tsx` is now ~310 lines — hooks + screen routing only.

### Hooks Extraction + Favorites
Extracted state into 6 custom hooks (`useGeolocation`, `useFavorites`, `useForkDrop`, `useRoulette`, `useSwipe`, `useGroupSession`). Added saved favorites feature with localStorage persistence, heart icon on home screen, swipe-right auto-save.

### Result Caching + Rate Limiting
- Client-side: full Yelp batch cached by location+categories. Re-rolls reshuffle cache instead of re-fetching.
- Server-side: in-memory response cache on `/api/restaurants` with 60s TTL.

### Group Vote Fallback
When all restaurants are voted on with no unanimous pick, auto-selects the one with the most yes votes. Result screen distinguishes unanimous vs fallback.

### NoMoreScreen Favorites Prompt
When user has saved spots, "Check saved spots" becomes primary CTA. Copy adapts contextually.

### Bug Fix: group-join Screen
Added missing render block — users joining via `?join=CODE` URL param now see the group setup screen with code pre-filled.

---

## What Is Complete

- Location input with GPS auto-detect (Nominatim reverse geocoding)
- 2-question vibe quiz + drinks sub-flow
- Yelp API integration with NYC neighborhood strict filtering
- Tinder-style card swiping (touch + mouse)
- Delivery modal (Uber Eats, DoorDash, Grubhub, Postmates, Seamless)
- Reservation modal (OpenTable, Resy, Yelp)
- Group voting via Supabase Realtime with fallback for no-consensus
- Fork Roulette (monthly spin-to-win)
- Fork Drops (time-limited promotions)
- Lottery entry tracking (device-based)
- Component decomposition into 20+ files
- Custom hooks extraction (6 hooks)
- Saved favorites with localStorage persistence
- Result caching (client + server)
- API rate limiting (server-side, 60s TTL)

---

## What Is NOT Built Yet

- **User accounts / auth** — all anonymous, device ID only
- **Admin dashboard** — no panel for managing drops, prizes, lottery
- **Prize redemption flow** — roulette just says "we'll email you"
- **Analytics / event tracking** — no usage metrics
- **Email notifications** — no Resend/SendGrid integration

---

## Known Issues

1. Group code generation uses `Math.random()` — not cryptographically secure
2. Device ID forgeable via localStorage clear
3. Roulette prize info is hardcoded in the UI ("Tasting Menu for Two") even though DB prizes may differ
4. Server-side cache is per-instance (serverless) — not shared across cold starts

---

## Repo & Deployment

- **GitHub:** https://github.com/sethjfried-cloud/Fork
- **Hosting:** Vercel (connected to GitHub, auto-deploys on push)
- **Env vars:** Set in Vercel dashboard (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `YELP_API_KEY`)
