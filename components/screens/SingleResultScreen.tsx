"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Restaurant, Screen } from "@/lib/types"
import { CARD_COLORS } from "@/lib/constants"

type Props = {
  currentRestaurant: Restaurant
  currentResultIdx: number
  totalResults: number
  approximate: boolean
  swipeDir: "left" | "right" | null
  dragX: number
  dragging: boolean
  showSwipeHint: boolean
  isFavorite: boolean
  onSwipeStart: (clientX: number) => void
  onSwipeMove: (clientX: number) => void
  onSwipeEnd: () => void
  handleAccept: () => void
  handleReject: () => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function SingleResultScreen({
  currentRestaurant, currentResultIdx, totalResults, approximate,
  swipeDir, dragX, dragging, showSwipeHint, isFavorite,
  onSwipeStart, onSwipeMove, onSwipeEnd,
  handleAccept, handleReject, setScreen, dark,
}: Props) {
  return (
    <div style={dark} className="fade-in">
      <Wordmark back onBack={() => setScreen("location")} />
      <div style={{ textAlign: "center", marginBottom: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#888" }}>{currentResultIdx + 1} of {totalResults}</span>
        {isFavorite && (
          <span style={{ fontSize: 10, color: "#FF5C35", background: "rgba(255,92,53,0.15)", padding: "2px 8px", borderRadius: 8 }}>
            Saved
          </span>
        )}
      </div>

      {/* Restaurant Card */}
      <div
        className={swipeDir === "left" ? "swipe-left" : swipeDir === "right" ? "swipe-right" : ""}
        onMouseDown={e => onSwipeStart(e.clientX)}
        onMouseMove={e => { if (dragging) onSwipeMove(e.clientX) }}
        onMouseUp={() => onSwipeEnd()}
        onMouseLeave={() => onSwipeEnd()}
        onTouchStart={e => onSwipeStart(e.touches[0].clientX)}
        onTouchMove={e => onSwipeMove(e.touches[0].clientX)}
        onTouchEnd={() => onSwipeEnd()}
        style={{
          background: "#141414",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 24,
          cursor: "grab",
          userSelect: "none",
          transform: dragging ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)` : "none",
          transition: dragging ? "none" : "transform .3s ease",
          position: "relative",
        }}>

        {/* Swipe indicators */}
        {dragX > 40 && (
          <div style={{ position: "absolute", top: 20, right: 20, background: "#1D9E75", color: "#fff", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 10 }}>
            {"LET'S GO!"}
          </div>
        )}
        {dragX < -40 && (
          <div style={{ position: "absolute", top: 20, left: 20, background: "#D85A30", color: "#fff", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 10 }}>
            NOPE
          </div>
        )}

        {/* Restaurant Image */}
        {currentRestaurant.image ? (
          <div style={{
            width: "100%",
            height: 200,
            background: `url(${currentRestaurant.image}) center/cover`,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              height: 80, background: "linear-gradient(transparent, #141414)",
            }} />
          </div>
        ) : (
          <div style={{
            width: "100%",
            height: 120,
            background: CARD_COLORS[currentResultIdx % CARD_COLORS.length],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 700,
            color: "#fff",
          }}>
            {currentRestaurant.name[0]}
          </div>
        )}

        {/* Card Content */}
        <div style={{ padding: "20px 24px 28px" }}>
          <h2 className="fork-serif" style={{ fontSize: 26, fontWeight: 400, color: "#fff", marginBottom: 8 }}>
            {currentRestaurant.name}
          </h2>
          {/* Travel time tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {currentRestaurant.distance != null && currentRestaurant.distance <= 0.4 && (
              <span style={{ fontSize: 10, color: "#1D9E75", background: "rgba(29,158,117,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                {Math.max(1, Math.round(currentRestaurant.distance * 20))} min walk
              </span>
            )}
            {currentRestaurant.distance != null && currentRestaurant.distance <= 2.5 && (
              <span style={{ fontSize: 10, color: "#7F77DD", background: "rgba(127,119,221,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                {Math.max(2, Math.round(currentRestaurant.distance * 5))} min bike
              </span>
            )}
            {currentRestaurant.distance != null && (
              <span style={{ fontSize: 10, color: "#F4A261", background: "rgba(244,162,97,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                {Math.max(2, Math.round(currentRestaurant.distance * 2.5))} min drive
              </span>
            )}
            {currentRestaurant.distance != null && currentRestaurant.distance <= 5 && (
              <span style={{ fontSize: 10, color: "#888", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: 10 }}>
                ~{Math.max(5, Math.round(currentRestaurant.distance * 6))} min transit
              </span>
            )}
            {approximate && (
              <span style={{ fontSize: 10, color: "#E9C46A", background: "rgba(233,196,106,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                Nearby area
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
            {currentRestaurant.categories} · {currentRestaurant.price}
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#F4A261" }}>★ {currentRestaurant.rating}</span>
            <span style={{ fontSize: 13, color: "#888" }}>({currentRestaurant.reviewCount})</span>
          </div>
          <p style={{ fontSize: 13, color: "#888" }}>
            {currentRestaurant.address}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <button
          onClick={handleReject}
          className="action-btn"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#1A1A1A", border: "2px solid #D85A30",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform .15s",
          }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={handleAccept}
          className="action-btn"
          style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#1D9E75", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform .15s",
          }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {showSwipeHint && (
        <p style={{ fontSize: 12, color: "#444", textAlign: "center", marginTop: 16 }}>
          Swipe left to skip, swipe right to go
        </p>
      )}
    </div>
  )
}
