"use client"

import { Wordmark } from "@/components/Wordmark"
import { VIBE_CARDS } from "@/lib/constants"

type Props = {
  cardIdx: number
  animKey: number
  selected: string | null
  goBack: () => void
  advance: (key: string, value: string) => void
}

export function QuizScreen({ cardIdx, animKey, selected, goBack, advance }: Props) {
  const card = VIBE_CARDS[cardIdx]

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 24px 16px" }}>
        <Wordmark back onBack={goBack} />
      </div>

      <div key={animKey} className="card-in"
        style={{
          background: "#141414", borderRadius: "20px 20px 0 0",
          padding: "32px 24px 44px", flex: 1,
        }}>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "center" }}>
          {VIBE_CARDS.map((_, i) => (
            <div key={i} style={{
              width: i === cardIdx ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i <= cardIdx ? "#FF5C35" : "#333",
              transition: "all .3s",
            }} />
          ))}
        </div>

        <h2 className="fork-serif" style={{ fontSize: 32, fontWeight: 400, color: "#fff", lineHeight: 1.2, marginBottom: 32, textAlign: "center" }}>
          {card.q}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {card.options.map(opt => (
            <button key={opt.value} className="opt"
              onClick={() => advance(card.key, opt.value)}
              disabled={!!selected}
              style={{
                padding: "18px 20px",
                border: "none",
                borderRadius: 14,
                background: selected === opt.value ? "#FF5C35" : "#1A1A1A",
                color: "#fff",
                fontSize: 16, fontWeight: 500, cursor: "pointer",
                transition: "all .15s", textAlign: "left",
                fontFamily: "inherit",
                transform: selected === opt.value ? "scale(0.98)" : "scale(1)",
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
