"use client"

import type { Screen } from "@/lib/types"
import { MOOD_PRESETS, DIETARY_FILTERS } from "@/lib/constants"

type Props = {
  cityIn: string
  setCityIn: (v: string) => void
  setCoords: (v: { lat: number; lng: number }) => void
  justGo: (city?: string) => void
  pickMood: (mood: string) => void
  startQuiz: () => void
  setScreen: (s: Screen) => void
  activeDrop: { restaurant_name: string } | null
  dropTimeLeft: string
  favoritesCount: number
  dietaryActive: string[]
  dietaryToggle: (value: string) => void
  dark: React.CSSProperties
}

export function LocationScreen({ cityIn, setCityIn, setCoords, justGo, pickMood, startQuiz, setScreen, activeDrop, dropTimeLeft, favoritesCount, dietaryActive, dietaryToggle, dark }: Props) {
  return (
    <div style={{ ...dark, display: "flex", flexDirection: "column" }}>
      {/* Wordmark + Favorites */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 32, marginBottom: 48 }}>
        <div style={{ width: 36 }} />
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
          Fork
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#FF5C35" }} />
        </div>
        <button
          onClick={() => setScreen("favorites")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={favoritesCount > 0 ? "#FF5C35" : "none"}
              stroke={favoritesCount > 0 ? "#FF5C35" : "#555"}
              strokeWidth="1.5" />
          </svg>
          {favoritesCount > 0 && (
            <span style={{
              position: "absolute", top: -2, right: -4,
              background: "#FF5C35", color: "#fff",
              fontSize: 9, fontWeight: 700, borderRadius: 10,
              padding: "1px 5px", minWidth: 16, textAlign: "center",
            }}>
              {favoritesCount}
            </span>
          )}
        </button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 48, flex: 1 }}>
        <h1 className="fork-serif" style={{ fontSize: 44, fontWeight: 400, color: "#fff", lineHeight: 1.05, marginBottom: 16, letterSpacing: "-0.02em" }}>
          Stop scrolling.
          <br />
          <span style={{ color: "#FF5C35" }}>Start eating.</span>
        </h1>
        <p style={{ fontSize: 15, color: "#666", lineHeight: 1.5 }}>
          We pick one spot. You decide if you&apos;re in.
        </p>
      </div>

      {/* Dietary Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {DIETARY_FILTERS.map(f => {
          const on = dietaryActive.includes(f.value)
          return (
            <button key={f.value} onClick={() => dietaryToggle(f.value)}
              style={{
                background: on ? "rgba(255,92,53,0.15)" : "#141414",
                border: on ? "1px solid #FF5C35" : "1px solid #222",
                borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                fontSize: 12, color: on ? "#FF5C35" : "#666",
                fontFamily: "inherit", transition: "all .15s",
              }}>
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Location Section */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <input
            value={cityIn}
            onChange={e => setCityIn(e.target.value)}
            onKeyDown={e => e.key === "Enter" && justGo()}
            inputMode="search"
            placeholder="Astoria, Queens"
            style={{
              flex: 1,
              background: "#141414",
              border: "1px solid #222",
              borderRadius: 14,
              padding: "16px 18px",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async pos => {
                  const { latitude, longitude } = pos.coords
                  setCoords({ lat: latitude, lng: longitude })
                  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                  const data = await res.json()
                  const neighborhood = data.address?.suburb || data.address?.neighbourhood || ""
                  const c = data.address?.city || data.address?.town || data.address?.village || ""
                  const loc = neighborhood ? `${neighborhood}, ${c}` : c
                  setCityIn(loc)
                  justGo(loc)
                }, undefined, { enableHighAccuracy: true })
              }
            }}
            style={{
              width: 54,
              height: 54,
              background: "#141414",
              border: "1px solid #222",
              borderRadius: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" stroke="#FF5C35" strokeWidth="1.5" />
              <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="#FF5C35" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={() => justGo()}
        style={{
          width: "100%",
          background: "#FF5C35",
          border: "none",
          borderRadius: 14,
          padding: "18px 24px",
          cursor: "pointer",
          marginBottom: 12,
          fontSize: 17,
          fontWeight: 600,
          color: "#fff",
          fontFamily: "inherit",
        }}>
        Pick for me
      </button>

      {/* Mood Presets */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MOOD_PRESETS.map(mood => (
            <button key={mood.value} onClick={() => pickMood(mood.value)}
              style={{
                background: "#141414", border: "1px solid #222",
                borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                fontSize: 13, color: "#ccc", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
                transition: "border-color .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#444")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#222")}>
              <span style={{ fontSize: 16 }}>{mood.icon}</span>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Options */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => startQuiz()}
          style={{
            flex: 1,
            background: "#141414",
            border: "1px solid #222",
            borderRadius: 14,
            padding: "14px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "#888",
            fontFamily: "inherit",
          }}>
          Custom vibe
        </button>
        <button
          onClick={() => setScreen("group-setup")}
          style={{
            flex: 1,
            background: "#141414",
            border: "1px solid #222",
            borderRadius: 14,
            padding: "14px 16px",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "#888",
            fontFamily: "inherit",
          }}>
          With friends
        </button>
      </div>

      {/* Fork Drop Banner */}
      {activeDrop && (
        <button
          onClick={() => setScreen("drop")}
          style={{
            width: "100%",
            background: "#1D9E75",
            border: "none",
            borderRadius: 14,
            padding: "14px 18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginBottom: 2 }}>FORK DROP</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{activeDrop.restaurant_name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{dropTimeLeft}</div>
          </div>
        </button>
      )}
    </div>
  )
}
