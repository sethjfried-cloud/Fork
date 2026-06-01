# Fork — Session Primer

> Claude rewrites this file at the end of every session.
> Read this first at the start of every session before doing anything else.

---

## Last Updated

2026-06-01 (Seth + Claude) — **Monolith decomposition complete. Build passes clean.**

---

## What Just Happened

### Component Decomposition (COMPLETE)

Broke up the 2,312-line `page.tsx` monolith into 20 files:

- **3 shared libs:** `lib/types.ts`, `lib/constants.ts`, `lib/utils.ts`
- **3 shared components:** `Wordmark`, `SlotSpinner`, `OrderModal`
- **13 screen components:** one per app screen in `components/screens/`
- **`page.tsx`** is now 778 lines — state management and screen routing only, no UI markup

Build compiles clean with zero TypeScript errors.

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
- Component decomposition (this session)

---

## What Is NOT Built Yet

- **User accounts / auth** — all anonymous, device ID only
- **Saved favorites / history** — no persistence of liked restaurants
- **Admin dashboard** — no panel for managing drops, prizes, lottery
- **Prize redemption flow** — roulette just says "we'll email you"
- **Analytics / event tracking** — no usage metrics
- **Email notifications** — no Resend/SendGrid integration
- **Rate limiting** — Yelp API calls unthrottled
- **Result caching** — re-rolls re-fetch from Yelp every time

---

## Known Issues

1. `lib/preferenceMapper.ts` is dead code — unused, superseded by inline mappings in constants.ts
2. Group voting requires unanimous consensus — no fallback for stalled votes
3. Group code generation uses `Math.random()` — not cryptographically secure
4. Device ID forgeable via localStorage clear
5. Roulette prize info is hardcoded in the UI ("Tasting Menu for Two") even though DB prizes may differ

---

## Repo & Deployment

- **GitHub:** https://github.com/sethjfried-cloud/Fork
- **Hosting:** Vercel (connected to GitHub, auto-deploys on push)
- **Env vars:** Set in Vercel dashboard (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `YELP_API_KEY`)
