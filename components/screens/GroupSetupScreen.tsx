"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Screen } from "@/lib/types"

type Props = {
  playerName: string
  setPlayerName: (v: string) => void
  cityIn: string
  setCityIn: (v: string) => void
  joinCode: string
  setJoinCode: (v: string) => void
  error: string | null
  createGroupSession: () => void
  joinGroupSession: () => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function GroupSetupScreen({
  playerName, setPlayerName, cityIn, setCityIn,
  joinCode, setJoinCode, error,
  createGroupSession, joinGroupSession, setScreen, dark,
}: Props) {
  return (
    <div style={dark} className="fade-in">
      <Wordmark back onBack={() => setScreen("location")} />
      <h1 className="fork-serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
        {"Let's decide together"}
      </h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
        Everyone votes, first unanimous pick wins.
      </p>

      <input
        value={playerName}
        onChange={e => setPlayerName(e.target.value)}
        placeholder="Your name"
        style={{ width: "100%", background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 16 }}
      />

      <input
        value={cityIn}
        onChange={e => setCityIn(e.target.value)}
        placeholder="Location (e.g. Brooklyn, NY)"
        style={{ width: "100%", background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 20 }}
      />

      <button
        onClick={createGroupSession}
        disabled={!playerName.trim()}
        style={{
          width: "100%",
          background: playerName.trim() ? "linear-gradient(135deg, #7F77DD 0%, #9B93E8 100%)" : "#333",
          border: "none",
          borderRadius: 14,
          padding: "16px",
          cursor: playerName.trim() ? "pointer" : "not-allowed",
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
          marginBottom: 20,
        }}>
        Create a group
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: .5, background: "#1E1E1E" }} />
        <span style={{ fontSize: 12, color: "#444" }}>or join one</span>
        <div style={{ flex: 1, height: .5, background: "#1E1E1E" }} />
      </div>

      <input
        value={joinCode}
        onChange={e => setJoinCode(e.target.value.toUpperCase())}
        placeholder="Enter group code"
        maxLength={6}
        style={{ width: "100%", background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 16, textAlign: "center", letterSpacing: 4, textTransform: "uppercase" }}
      />

      <button
        onClick={joinGroupSession}
        disabled={!joinCode.trim() || !playerName.trim()}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px solid #7F77DD",
          borderRadius: 14,
          padding: "14px",
          cursor: (joinCode.trim() && playerName.trim()) ? "pointer" : "not-allowed",
          fontSize: 14,
          color: "#7F77DD",
          opacity: (joinCode.trim() && playerName.trim()) ? 1 : .5,
        }}>
        Join group
      </button>

      {error && <p style={{ color: "#D85A30", fontSize: 13, marginTop: 16, textAlign: "center" }}>{error}</p>}
    </div>
  )
}
