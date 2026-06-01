"use client"

import { Wordmark } from "@/components/Wordmark"
import { DRINKS_OPTIONS } from "@/lib/constants"

type Props = {
  city: string
  selected: string | null
  onBack: () => void
  selectDrinksOption: (value: string) => void
}

export function DrinksFlowScreen({ city, selected, onBack, selectDrinksOption }: Props) {
  return (
    <div style={{ background: "#0D0D0D", minHeight: "100dvh" }}>
      <div style={{ padding: "28px 24px 16px" }}>
        <Wordmark back onBack={onBack} />
      </div>

      <div className="card-in" style={{
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "28px 24px 44px", minHeight: 520,
      }}>
        <h2 className="fork-serif" style={{ fontSize: 26, fontWeight: 700, color: "#141414", lineHeight: 1.2, marginBottom: 12 }}>
          What kind of drinks?
        </h2>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>
          {city || "Your area"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {DRINKS_OPTIONS.map(opt => (
            <button key={opt.value} className="opt"
              onClick={() => selectDrinksOption(opt.value)}
              disabled={!!selected}
              style={{
                padding: "20px 16px",
                border: `1.5px solid ${selected === opt.value ? "#7F77DD" : "#E8E8E8"}`,
                borderRadius: 14,
                background: selected === opt.value ? "#7F77DD" : "transparent",
                color: selected === opt.value ? "#fff" : "#1A1A1A",
                fontSize: 16, fontWeight: 500, cursor: "pointer",
                transition: "all .15s", textAlign: "left",
                fontFamily: "inherit",
                transform: selected === opt.value ? "scale(0.98)" : "scale(1)",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}>
              <span style={{ fontSize: 24 }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
