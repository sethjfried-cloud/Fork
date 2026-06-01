"use client"

import type { Screen } from "@/lib/types"

type Props = {
  rollAgain: () => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function NoMoreScreen({ rollAgain, setScreen, dark }: Props) {
  return (
    <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
      <div style={{ fontSize: 56, marginBottom: 20 }}>🤷‍♂️</div>
      <h2 className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        {"That's all we found"}
      </h2>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
        Nothing hit? Let&apos;s try again.
      </p>
      <button
        onClick={() => rollAgain()}
        style={{ background: "#FF5C35", border: "none", borderRadius: 12, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>🤷‍♂️</span>
        <span>Roll again</span>
      </button>
      <button
        onClick={() => setScreen("location")}
        style={{ background: "transparent", border: "1px solid #333", borderRadius: 12, padding: "12px 24px", color: "#666", fontSize: 14, cursor: "pointer" }}>
        Change location
      </button>
    </div>
  )
}
