"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Screen } from "@/lib/types"

type ActiveDrop = {
  id: string
  restaurant_name: string
  description: string
  city: string
  image_url?: string
  ends_at: string
}

type Props = {
  activeDrop: ActiveDrop
  dropClaimed: boolean
  dropTimeLeft: string
  claimDrop: () => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function DropScreen({ activeDrop, dropClaimed, dropTimeLeft, claimDrop, setScreen, dark }: Props) {
  return (
    <div style={dark} className="fade-in">
      <Wordmark back onBack={() => setScreen("location")} />

      {/* Drop Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "#1D9E75", borderRadius: 8, padding: "6px 12px", marginBottom: 16,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>Fork Drop</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{dropTimeLeft}</span>
      </div>

      <h1 className="fork-serif" style={{ fontSize: 32, fontWeight: 400, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
        {activeDrop.restaurant_name}
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>{activeDrop.city}</p>
      <p style={{ fontSize: 15, color: "#ccc", lineHeight: 1.6, marginBottom: 28 }}>{activeDrop.description}</p>

      {/* Editorial Note */}
      <div style={{ background: "#1A1A1A", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#1D9E75", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{"Fork's Take"}</div>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, fontStyle: "italic" }}>
          {"Hand-picked by our team. This is one of those spots you tell friends about. Limited to 24 hours because good things don't wait."}
        </p>
      </div>

      {/* Claim Button */}
      {dropClaimed ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#1D9E75", marginBottom: 16 }}>You claimed this drop</div>
          <button
            onClick={() => setScreen("location")}
            style={{ width: "100%", background: "#1A1A1A", border: "1px solid #333", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#888" }}>
            Back to Fork
          </button>
        </div>
      ) : (
        <button
          onClick={claimDrop}
          style={{ width: "100%", background: "#1D9E75", border: "none", borderRadius: 14, padding: "18px", cursor: "pointer", fontSize: 17, fontWeight: 600, color: "#fff" }}>
          {"I'm in"}
        </button>
      )}
    </div>
  )
}
