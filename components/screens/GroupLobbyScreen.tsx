"use client"

import { Wordmark } from "@/components/Wordmark"
import type { GroupSession, Participant, Screen } from "@/lib/types"

type Props = {
  groupSession: GroupSession
  participant: Participant | null
  participants: Participant[]
  linkCopied: boolean
  getShareLink: () => string
  copyShareLink: () => void
  startGroupVoting: () => void
  setGroupSession: (s: GroupSession | null) => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function GroupLobbyScreen({
  groupSession, participant, participants,
  linkCopied, getShareLink, copyShareLink,
  startGroupVoting, setGroupSession, setScreen, dark,
}: Props) {
  return (
    <div style={dark} className="fade-in">
      <Wordmark back onBack={() => { setGroupSession(null); setScreen("location") }} />
      <h1 className="fork-serif" style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
        Waiting for everyone
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>{groupSession.location}</p>

      <div style={{ background: "#141414", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12, textAlign: "center" }}>Share this link</div>
        <div style={{
          background: "#0D0D0D",
          borderRadius: 10,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}>
          <div style={{
            flex: 1,
            fontSize: 13,
            color: "#888",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {getShareLink()}
          </div>
          <button
            onClick={copyShareLink}
            style={{
              background: linkCopied ? "#1D9E75" : "#7F77DD",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .15s",
            }}>
            {linkCopied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: "#444" }}>
          or share code: <span style={{ color: "#7F77DD", fontWeight: 600, letterSpacing: 2, fontFamily: "monospace" }}>{groupSession.code}</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        {participants.length} {participants.length === 1 ? "person" : "people"} joined
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {participants.map(p => (
          <div key={p.id} style={{ background: "#1A1A1A", borderRadius: 20, padding: "8px 14px", fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            {p.name}
            {p.is_host && <span style={{ fontSize: 10, color: "#7F77DD" }}>HOST</span>}
          </div>
        ))}
      </div>

      {participant?.is_host ? (
        <button
          onClick={startGroupVoting}
          disabled={participants.length < 2}
          style={{
            width: "100%",
            background: participants.length >= 2 ? "linear-gradient(135deg, #7F77DD 0%, #9B93E8 100%)" : "#333",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            cursor: participants.length >= 2 ? "pointer" : "not-allowed",
            fontSize: 15,
            fontWeight: 600,
            color: "#fff",
          }}>
          {participants.length < 2 ? "Waiting for more people..." : "Start voting"}
        </button>
      ) : (
        <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>
          Waiting for host to start...
        </div>
      )}
    </div>
  )
}
