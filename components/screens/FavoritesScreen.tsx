"use client"

import { Wordmark } from "@/components/Wordmark"
import type { Restaurant, Screen } from "@/lib/types"
import { CARD_COLORS } from "@/lib/constants"

type Props = {
  favorites: Restaurant[]
  removeFavorite: (id: string) => void
  setOrderModal: (r: Restaurant | null) => void
  setScreen: (s: Screen) => void
  dark: React.CSSProperties
}

export function FavoritesScreen({ favorites, removeFavorite, setOrderModal, setScreen, dark }: Props) {
  return (
    <div style={dark} className="fade-in">
      <Wordmark back onBack={() => setScreen("location")} />

      <h1 className="fork-serif" style={{ fontSize: 28, fontWeight: 400, color: "#fff", marginBottom: 4 }}>
        Saved spots
      </h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        {favorites.length} {favorites.length === 1 ? "restaurant" : "restaurants"}
      </p>

      {favorites.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍴</div>
          <p style={{ fontSize: 15, color: "#888", marginBottom: 8 }}>Nothing saved yet</p>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 28 }}>
            Swipe right on a restaurant to save it here.
          </p>
          <button
            onClick={() => setScreen("location")}
            style={{ background: "#FF5C35", border: "none", borderRadius: 14, padding: "14px 28px", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Find restaurants
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {favorites.map((r, i) => (
            <div key={r.id} style={{
              background: "#141414", borderRadius: 16, overflow: "hidden",
              display: "flex", alignItems: "stretch",
            }}>
              {/* Image or color block */}
              {r.image ? (
                <div style={{
                  width: 88, minHeight: 88, flexShrink: 0,
                  background: `url(${r.image}) center/cover`,
                }} />
              ) : (
                <div style={{
                  width: 88, minHeight: 88, flexShrink: 0,
                  background: CARD_COLORS[i % CARD_COLORS.length],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 700, color: "#fff",
                }}>
                  {r.name[0]}
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  {r.categories} · {r.price}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#F4A261" }}>★ {r.rating}</span>
                  <span style={{ fontSize: 11, color: "#666" }}>({r.reviewCount})</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, padding: "8px 12px", flexShrink: 0 }}>
                <button
                  onClick={() => setOrderModal(r)}
                  style={{
                    background: "#1D9E75", border: "none", borderRadius: 8,
                    padding: "8px 12px", cursor: "pointer",
                    fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap",
                  }}>
                  Order
                </button>
                <button
                  onClick={() => removeFavorite(r.id)}
                  style={{
                    background: "transparent", border: "1px solid #333", borderRadius: 8,
                    padding: "6px 10px", cursor: "pointer",
                    fontSize: 11, color: "#666", whiteSpace: "nowrap",
                  }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
