"use client"

import { useState, useEffect } from "react"
import { SLOT_ITEMS } from "@/lib/constants"

export function SlotSpinner({ spinning, onComplete }: { spinning: boolean; onComplete?: () => void }) {
  const [slots, setSlots] = useState([0, 0, 0])
  const [finalizing, setFinalizing] = useState(false)

  useEffect(() => {
    if (!spinning) return

    let interval: NodeJS.Timeout
    let count = 0
    const maxSpins = 20

    interval = setInterval(() => {
      setSlots([
        Math.floor(Math.random() * SLOT_ITEMS.length),
        Math.floor(Math.random() * SLOT_ITEMS.length),
        Math.floor(Math.random() * SLOT_ITEMS.length),
      ])
      count++
      if (count >= maxSpins) {
        clearInterval(interval)
        setFinalizing(true)
        setTimeout(() => {
          setSlots(prev => [Math.floor(Math.random() * SLOT_ITEMS.length), prev[1], prev[2]])
          setTimeout(() => {
            setSlots(prev => [prev[0], Math.floor(Math.random() * SLOT_ITEMS.length), prev[2]])
            setTimeout(() => {
              setSlots(prev => [prev[0], prev[1], Math.floor(Math.random() * SLOT_ITEMS.length)])
              setFinalizing(false)
              onComplete?.()
            }, 200)
          }, 200)
        }, 200)
      }
    }, 80)

    return () => clearInterval(interval)
  }, [spinning, onComplete])

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
      {slots.map((slot, i) => (
        <div
          key={i}
          style={{
            width: 64,
            height: 80,
            background: "#1A1A1A",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            border: "2px solid #222",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,.5)",
            transition: finalizing ? "all .2s" : "none",
          }}>
          {SLOT_ITEMS[slot]}
        </div>
      ))}
    </div>
  )
}
