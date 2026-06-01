"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Screen } from "@/lib/types"

type Props = {
  rouletteSpinning: boolean
  rouletteResult: { won: boolean; prize?: string; city?: string } | null
  canSpinRoulette: boolean
  spinRoulette: () => void
  setRouletteResult: (r: { won: boolean; prize?: string; city?: string } | null) => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function RouletteScreen({
  rouletteSpinning, rouletteResult, canSpinRoulette,
  spinRoulette, setRouletteResult, setScreen, dark,
}: Props) {
  return (
    <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
      <Wordmark back onBack={() => { setScreen("location"); setRouletteResult(null) }} />

      <h1 className="fork-serif" style={{ fontSize: 28, fontWeight: 400, color: "#fff", marginBottom: 8 }}>
        Fork Roulette
      </h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>
        One spin per month. Make it count.
      </p>

      {/* Roulette Wheel */}
      <div style={{ position: "relative", width: 240, height: 240, marginBottom: 32 }}>
        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "conic-gradient(#FF5C35 0deg 45deg, #1D9E75 45deg 90deg, #7F77DD 90deg 135deg, #F4A261 135deg 180deg, #FF5C35 180deg 225deg, #1D9E75 225deg 270deg, #7F77DD 270deg 315deg, #F4A261 315deg 360deg)",
          animation: rouletteSpinning ? "roulette-spin 3s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards" : "none",
          boxShadow: "0 0 40px rgba(255,92,53,.3)",
        }} />
        {/* Inner circle */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: 100, height: 100, borderRadius: "50%", background: "#141414",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          boxShadow: "0 4px 20px rgba(0,0,0,.5)",
        }}>
          🍴
        </div>
        {/* Pointer */}
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "12px solid transparent", borderRight: "12px solid transparent",
          borderTop: "20px solid #fff", zIndex: 10,
        }} />
      </div>

      {/* Result or Spin Button */}
      {rouletteResult ? (
        <div className="fade-in" style={{ width: "100%" }}>
          {rouletteResult.won ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 className="fork-serif" style={{ fontSize: 24, color: "#1D9E75", marginBottom: 8 }}>You won!</h2>
              <p style={{ fontSize: 16, color: "#fff", fontWeight: 600, marginBottom: 8 }}>{rouletteResult.prize}</p>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>{"We'll email you to claim your prize."}</p>
            </>
          ) : (
            <>
              <h2 className="fork-serif" style={{ fontSize: 22, color: "#888", marginBottom: 8 }}>Not this time</h2>
              <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Come back next month for another spin!</p>
            </>
          )}
          <button
            onClick={() => { setScreen("location"); setRouletteResult(null) }}
            style={{ width: "100%", background: "#FF5C35", border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff" }}>
            Back to Fork
          </button>
        </div>
      ) : canSpinRoulette ? (
        <button
          onClick={spinRoulette}
          disabled={rouletteSpinning}
          style={{
            width: "100%",
            background: rouletteSpinning ? "#333" : "linear-gradient(135deg, #7F77DD 0%, #FF5C35 100%)",
            border: "none", borderRadius: 14, padding: "18px",
            cursor: rouletteSpinning ? "default" : "pointer",
            fontSize: 17, fontWeight: 600, color: "#fff", transition: "all .2s",
          }}>
          {rouletteSpinning ? "Spinning..." : "Spin the Wheel"}
        </button>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>{"You've already spun this month."}</p>
          <button
            onClick={() => setScreen("location")}
            style={{ width: "100%", background: "#1A1A1A", border: "1px solid #333", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#888" }}>
            Back to Fork
          </button>
        </div>
      )}

      {/* Prize info */}
      {!rouletteResult && (
        <div style={{ marginTop: 32, padding: "16px", background: "#1A1A1A", borderRadius: 12, width: "100%" }}>
          <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>This Month{"'"}s Prizes</div>
          <div style={{ fontSize: 13, color: "#F4A261", marginBottom: 4 }}>Grand: Tasting Menu for Two</div>
          <div style={{ fontSize: 12, color: "#888" }}>Consolation: Free Dessert</div>
        </div>
      )}
    </div>
  )
}
