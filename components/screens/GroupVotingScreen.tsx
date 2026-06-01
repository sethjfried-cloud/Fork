"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Restaurant, GroupSession, Participant } from "@/lib/types"
import { CARD_COLORS } from "@/lib/constants"

type Props = {
  currentRestaurant: Restaurant
  currentResultIdx: number
  totalResults: number
  groupSession: GroupSession
  participant: Participant | null
  participants: Participant[]
  groupVotes: Record<string, Record<string, "yes" | "no">>
  submitGroupVote: (restaurantId: string, vote: "yes" | "no") => void
  dark: React.CSSProperties
}

export function GroupVotingScreen({
  currentRestaurant, currentResultIdx, totalResults,
  groupSession, participant, participants, groupVotes,
  submitGroupVote, dark,
}: Props) {
  return (
    <div style={dark} className="fade-in">
      <Wordmark />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "#7F77DD" }}>Group: {groupSession.code}</span>
        <span style={{ fontSize: 12, color: "#888" }}>{currentResultIdx + 1} of {totalResults}</span>
      </div>

      {/* Restaurant Card */}
      <div style={{ background: "#141414", borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
        {currentRestaurant.image ? (
          <div style={{
            width: "100%", height: 180,
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
            width: "100%", height: 120,
            background: CARD_COLORS[currentResultIdx % CARD_COLORS.length],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48, fontWeight: 700, color: "#fff",
          }}>
            {currentRestaurant.name[0]}
          </div>
        )}
        <div style={{ padding: "20px 24px 24px" }}>
          <h2 className="fork-serif" style={{ fontSize: 20, fontWeight: 400, color: "#fff", textAlign: "center", marginBottom: 6 }}>
            {currentRestaurant.name}
          </h2>
          <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 12 }}>
            {currentRestaurant.categories} · {currentRestaurant.price}
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#F4A261" }}>★ {currentRestaurant.rating}</span>
            {currentRestaurant.distance != null && (
              <span style={{ fontSize: 12, color: "#666" }}>· {currentRestaurant.distance} mi</span>
            )}
          </div>
        </div>
      </div>

      {/* Vote status */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Votes on this pick:</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {participants.map(p => {
            const vote = groupVotes[currentRestaurant.id]?.[p.id]
            return (
              <div key={p.id} style={{
                background: vote === "yes" ? "rgba(29,158,117,.2)" : vote === "no" ? "rgba(216,90,48,.2)" : "#1A1A1A",
                borderRadius: 12,
                padding: "6px 12px",
                fontSize: 12,
                color: vote === "yes" ? "#1D9E75" : vote === "no" ? "#D85A30" : "#666",
              }}>
                {p.name} {vote === "yes" ? "✓" : vote === "no" ? "✗" : "..."}
              </div>
            )
          })}
        </div>
      </div>

      {/* Voting buttons */}
      {!groupVotes[currentRestaurant.id]?.[participant?.id || ""] ? (
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => submitGroupVote(currentRestaurant.id, "no")}
            style={{ flex: 1, background: "#1A1A1A", border: "2px solid #D85A30", borderRadius: 14, padding: "16px", cursor: "pointer", color: "#D85A30", fontSize: 15, fontWeight: 600 }}>
            Nope
          </button>
          <button
            onClick={() => submitGroupVote(currentRestaurant.id, "yes")}
            style={{ flex: 1, background: "#1D9E75", border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", color: "#fff", fontSize: 15, fontWeight: 600 }}>
            {"I'm in!"}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "#666", fontSize: 14, padding: "16px" }}>
          Waiting for others to vote...
        </div>
      )}
    </div>
  )
}
