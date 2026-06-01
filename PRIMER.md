# Fork — Session Primer

> Claude rewrites this file at the end of every session.
> Read this first at the start of every session before doing anything else.

---

## Last Updated

2026-06-01 (Seth + Claude) — **Smart re-roll, time-aware suggestions, enhanced cards shipped.**

---

## Session 1 Summary

### Architecture
- Decomposed 2,312-line `page.tsx` monolith into 20+ files
- Extracted state into 6 custom hooks — `page.tsx` is now ~320 lines
- All screen components in `components/screens/`, shared components in `components/`

### Features Built
- **Saved favorites** — swipe right auto-saves, localStorage persistence, heart icon + badge, FavoritesScreen with order/remove
- **Result caching** — client-side cache by location+categories, server-side 60s TTL on API route
- **Smart re-roll** — rejected restaurants excluded from reshuffles, never see a "nope" twice
- **Time-aware suggestions** — API adjusts categories by hour (breakfast/brunch/happy hour/late night)
- **Enhanced cards** — service tags (Delivery, Pickup, Reservations) + phone number on restaurant cards
- **Group vote fallback** — when no unanimous pick, auto-selects most-voted restaurant
- **NoMoreScreen favorites prompt** — "Check saved spots" CTA when user has favorites
- **group-join screen** — fixed blank screen when joining via URL param

---

## What Is Complete

- Location input with GPS auto-detect (Nominatim reverse geocoding)
- 2-question vibe quiz + drinks sub-flow
- Yelp API integration with NYC neighborhood strict filtering
- Tinder-style card swiping (touch + mouse) with smart rejection tracking
- Delivery modal (Uber Eats, DoorDash, Grubhub, Postmates, Seamless)
- Reservation modal (OpenTable, Resy, Yelp)
- Group voting via Supabase Realtime with fallback for no-consensus
- Fork Roulette (monthly spin-to-win)
- Fork Drops (time-limited promotions)
- Lottery entry tracking (device-based)
- Saved favorites with localStorage persistence
- Result caching (client + server) + API rate limiting
- Time-aware category suggestions
- Enhanced restaurant cards with service tags + phone

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
