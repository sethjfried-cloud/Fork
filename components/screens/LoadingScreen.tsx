"use client"

import { SlotSpinner } from "@/components/SlotSpinner"

type Props = {
  slotSpinning: boolean
  dark: React.CSSProperties
}

export function LoadingScreen({ slotSpinning, dark }: Props) {
  return (
    <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <SlotSpinner spinning={slotSpinning} />
      <div className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
        Finding your match
      </div>
      <div style={{ fontSize: 14, color: "#444" }}>
        {"Checking what's open and delivers..."}
      </div>
    </div>
  )
}
