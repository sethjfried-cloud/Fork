# CLAUDE.md — Fork

This file provides guidance to Claude Code when working with Fork.

---

## Session Protocol

### On session START — read in this order:
1. `PRIMER.md` — current state, what's built, what's in progress
2. This file (`CLAUDE.md`) — architecture, conventions, tech stack

### On session END (or at any natural pause):
- **Rewrite `PRIMER.md`** — update all sections to reflect current state
- Note any corrections or lessons learned

---

## What Is Fork?

A restaurant picker app with Tinder-style swipes. The elevator pitch: "You know that one friend who always just picks the restaurant and everyone ends up having a great time? That's Fork."

**Core loop:** Location → optional vibe quiz → one restaurant card at a time → swipe right to accept → delivery/reservation links.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16.2.4 | App Router, `"use client"` for main page |
| UI | React 19 + Tailwind 4 | Inline styles for components, Tailwind for globals |
| Database | Supabase | Realtime for group voting, anonymous device IDs |
| Restaurant Data | Yelp Fusion API | Server-side only (`/api/restaurants`) |
| Geocoding | Nominatim (OpenStreetMap) | Free, no API key needed |
| Fonts | DM Sans + DM Serif Display | Via `next/font/google` in layout.tsx |
| Hosting | Vercel | Connected to GitHub repo |

---

## Project Structure

```
fork-app/
├── app/
│   ├── api/restaurants/route.ts   # Yelp API proxy (server-side)
│   ├── globals.css                # CSS variables, dark theme
│   ├── layout.tsx                 # Font loading, metadata, viewport
│   └── page.tsx                   # State management + screen router (~780 lines)
├── components/
│   ├── Wordmark.tsx               # Logo + back button
│   ├── SlotSpinner.tsx            # Loading animation (slot machine)
│   ├── OrderModal.tsx             # Delivery/reservation bottom sheet
│   └── screens/                   # One component per app screen
│       ├── LocationScreen.tsx     # Home/hero with location input
│       ├── QuizScreen.tsx         # 2-question vibe assessment
│       ├── DrinksFlowScreen.tsx   # "Just drinks" sub-flow
│       ├── LoadingScreen.tsx      # Slot machine spinner
│       ├── SingleResultScreen.tsx # Tinder-style swipe card
│       ├── NoMoreScreen.tsx       # Out of results
│       ├── ErrorScreen.tsx        # Fetch failed
│       ├── GroupSetupScreen.tsx   # Create/join group
│       ├── GroupLobbyScreen.tsx   # Waiting for participants
│       ├── GroupVotingScreen.tsx  # Consensus voting
│       ├── GroupResultScreen.tsx  # Unanimous pick result
│       ├── RouletteScreen.tsx    # Monthly spin-to-win
│       ├── FavoritesScreen.tsx   # Saved restaurants list
│       └── DropScreen.tsx        # Time-limited promo
├── lib/
│   ├── types.ts                   # Restaurant, GroupSession, Participant, Screen
│   ├── constants.ts               # VIBE_CARDS, delivery apps, slot items
│   ├── utils.ts                   # shuffleArray, getDeviceId, geocodeLocation
│   ├── hooks/
│   │   ├── useGeolocation.ts      # GPS detection, coords, city input
│   │   ├── useFavorites.ts        # localStorage-backed saved restaurants
│   │   ├── useForkDrop.ts         # Active drop fetching, claims, countdown
│   │   ├── useRoulette.ts         # Spin state, eligibility, prizes
│   │   ├── useSwipe.ts            # Drag state, direction, hint dismissal
│   │   └── useGroupSession.ts     # Group mode state + Supabase realtime
│   └── supabase/
│       ├── client.ts              # Browser Supabase client
│       └── server.ts              # Server Supabase client
└── public/                        # Static assets (default Next.js SVGs)
```

---

## Architecture

### Client-side app, server-side API

`page.tsx` is `"use client"` — all UI runs in the browser. The only server component is `/api/restaurants/route.ts` which proxies Yelp API calls (keeps the API key server-side).

### State lives in hooks + page.tsx

Domain state is owned by custom hooks in `lib/hooks/`. `page.tsx` orchestrates hooks and passes their state/callbacks to screen components as props. No context providers, no state library.

### Screen routing

The `screen` state variable controls which screen renders. Values: `location`, `quiz`, `drinks-flow`, `loading`, `single-result`, `no-more`, `results`, `group-setup`, `group-lobby`, `group-voting`, `group-result`, `roulette`, `drop`, `group-join`, `favorites`.

### No authentication

Users are anonymous. Device tracking uses `localStorage` (`fork_device_id`) for lottery/roulette eligibility.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
YELP_API_KEY=<yelp-fusion-api-key>
```

These are set in Vercel's environment variables for production. For local dev, use `.env.local`.

---

## Supabase Tables

| Table | Purpose |
|-------|---------|
| `group_sessions` | Host location, status (waiting/voting/complete), restaurants JSON, final_pick |
| `group_participants` | Session members with is_host flag |
| `group_votes` | Individual votes per restaurant per participant |
| `lottery_entries` | Device ID + restaurant + location + week/year |
| `roulette_spins` | Monthly spin results per device |
| `roulette_prizes` | Prize catalog by city (grand/consolation) |
| `fork_drops` | Time-limited restaurant promotions |
| `drop_claims` | Device claims per drop |

---

## Yelp API Route (`/api/restaurants`)

- **POST** with `{ location, latitude, longitude, categories, price, sort_by, neighborhood, limit }`
- Fetches 50 results from Yelp, filters to max 20
- Min 5 reviews required (filters ghost listings)
- Category blocklist (supermarkets, pharmacies, banks, hotels)
- NYC neighborhood strict filtering (prevents Astoria returning LIC results)
- 8-second timeout on Yelp fetch
- Returns `{ restaurants: Restaurant[], approximate: boolean }`

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#FF5C35` | Primary CTAs, brand orange |
| `--success` | `#1D9E75` | Accept/confirm, Fork Drops |
| `--group` | `#7F77DD` | Group mode purple |
| Reject | `#D85A30` | Nope/cancel burnt orange |
| Rating | `#F4A261` | Stars, secondary highlights |
| Background | `#0D0D0D` | App background |
| Card | `#141414` | Elevated surfaces |
| Border | `#222222` | Subtle borders |

**Fonts:** DM Sans (body/UI), DM Serif Display (headings/editorial)

---

## Conventions

- **Inline styles** — components use React `style` props, not CSS classes (except animation classes)
- **Animation classes** — defined in the `<style>` block in page.tsx: `.card-in`, `.fade-in`, `.swipe-left`, `.swipe-right`, etc.
- **Mobile-first** — max-width 390px, touch-optimized
- **No external UI library** — all components hand-built
- **`ifempty` pattern doesn't apply here** — that's Talaria/Make.com. Fork is pure React.

---

## Common Tasks

### Adding a new screen
1. Create `components/screens/NewScreen.tsx` with `"use client"` directive
2. Add screen name to `Screen` type in `lib/types.ts`
3. Add state/handlers in `page.tsx` if needed
4. Add render block in the screen router section of `page.tsx`

### Modifying restaurant data
- Yelp categories: update `VIBE_CARDS` or `DRINKS_OPTIONS` in `lib/constants.ts`
- Filtering logic: modify `/api/restaurants/route.ts`
- Display: modify `SingleResultScreen.tsx` or `GroupVotingScreen.tsx`

### Running locally
```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # Production build check
```
