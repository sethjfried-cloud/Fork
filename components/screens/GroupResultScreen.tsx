"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Restaurant, GroupSession, Participant, Screen } from "@/lib/types"

type Props = {
  groupSession: GroupSession
  groupVotes: Record<string, Record<string, "yes" | "no">>
  participants: Participant[]
  setOrderModal: (r: Restaurant | null) => void
  setGroupSession: (s: GroupSession | null) => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function GroupResultScreen({ groupSession, groupVotes, participants, setOrderModal, setGroupSession, setScreen, dark }: Props) {
  const finalPick = groupSession.final_pick!
  const pickVotes = groupVotes[finalPick.id] || {}
  const yesCount = Object.values(pickVotes).filter(v => v === "yes").length
  const isUnanimous = yesCount === participants.length

  return (
    <div style={dark} className="fade-in">
      <Wordmark />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{isUnanimous ? "🎉" : "🤝"}</div>
        <h1 className="fork-serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          {isUnanimous ? "Everyone agreed!" : "Top pick!"}
        </h1>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
          {isUnanimous
            ? "You're going to..."
            : `${yesCount} of ${participants.length} voted yes — the group favorite.`}
        </p>

        <div style={{ background: "#fff", borderRadius: 24, padding: "28px", marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: "#1D9E75",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, color: "#fff",
            margin: "0 auto 16px",
          }}>
            {finalPick.name[0]}
          </div>
          <h2 className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#141414", marginBottom: 6 }}>
            {finalPick.name}
          </h2>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 12 }}>
            {finalPick.categories} · {finalPick.price}
          </p>
          <p style={{ fontSize: 13, color: "#666" }}>
            {finalPick.address}
          </p>
        </div>

        <button
          onClick={() => setOrderModal(finalPick)}
          style={{ width: "100%", background: "#1D9E75", border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 12 }}>
          Order now
        </button>
        <button
          onClick={() => { setGroupSession(null); setScreen("location") }}
          style={{ width: "100%", background: "transparent", border: "1px solid #333", borderRadius: 12, padding: "14px", cursor: "pointer", color: "#666", fontSize: 13 }}>
          Start over
        </button>
      </div>
    </div>
  )
}
