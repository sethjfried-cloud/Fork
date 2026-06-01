"use client"

import type { Screen } from "@/lib/types"

type Props = {
  rollAgain: () => void
  favoritesCount: number
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function NoMoreScreen({ rollAgain, favoritesCount, setScreen, dark }: Props) {
  return (
    <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
      <div style={{ fontSize: 56, marginBottom: 20 }}>🤷‍♂️</div>
      <h2 className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
        {"That's all we found"}
      </h2>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
        {favoritesCount > 0
          ? `You've got ${favoritesCount} saved ${favoritesCount === 1 ? "spot" : "spots"} — or we can try again.`
          : "Nothing hit? Let's try again."}
      </p>
      {favoritesCount > 0 && (
        <button
          onClick={() => setScreen("favorites")}
          style={{ width: "100%", maxWidth: 280, background: "#FF5C35", border: "none", borderRadius: 12, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
          Check saved spots
        </button>
      )}
      <button
        onClick={() => rollAgain()}
        style={{ width: "100%", maxWidth: 280, background: favoritesCount > 0 ? "transparent" : "#FF5C35", border: favoritesCount > 0 ? "1px solid #333" : "none", borderRadius: 12, padding: favoritesCount > 0 ? "14px 32px" : "16px 32px", color: favoritesCount > 0 ? "#888" : "#fff", fontSize: favoritesCount > 0 ? 14 : 16, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
        Shuffle and try again
      </button>
      <button
        onClick={() => setScreen("location")}
        style={{ background: "transparent", border: "none", borderRadius: 12, padding: "12px 24px", color: "#555", fontSize: 13, cursor: "pointer" }}>
        Change location
      </button>
    </div>
  )
}
