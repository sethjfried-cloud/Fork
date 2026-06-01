"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Screen } from "@/lib/types"

type Props = {
  error: string | null
  setScreen: (s: Screen) => void
  setError: (e: string | null) => void
  dark: React.CSSProperties
}

export function ErrorScreen({ error, setScreen, setError, dark }: Props) {
  return (
    <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
      <Wordmark back onBack={() => setScreen("location")} />
      <div style={{ fontSize: 56, marginBottom: 20 }}>🍽️</div>
      <h2 className="fork-serif" style={{ fontSize: 24, fontWeight: 400, color: "#fff", marginBottom: 12 }}>
        Nothing matched
      </h2>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 8, maxWidth: 260, lineHeight: 1.5 }}>
        {error || "We couldn't find open spots for that search."}
      </p>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 32, maxWidth: 260, lineHeight: 1.5 }}>
        Try a different neighborhood or go with &quot;Pick for me&quot; to cast a wider net.
      </p>
      <button
        onClick={() => { setError(null); setScreen("location") }}
        style={{ background: "#FF5C35", border: "none", borderRadius: 14, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
        Start over
      </button>
    </div>
  )
}
