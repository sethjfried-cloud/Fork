"use client"

import { useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getDeviceId } from "@/lib/utils"

export function useRoulette(getSupabase: () => Promise<SupabaseClient>, getEffectiveLocation: () => string) {
  const [rouletteSpinning, setRouletteSpinning] = useState(false)
  const [rouletteResult, setRouletteResult] = useState<{ won: boolean; prize?: string; city?: string } | null>(null)
  const [canSpinRoulette, setCanSpinRoulette] = useState(true)

  async function spinRoulette() {
    const deviceId = getDeviceId()
    if (!deviceId || rouletteSpinning) return

    try {
      const supabase = await getSupabase()
      const now = new Date()
      const { data } = await supabase
        .from("roulette_spins").select("id")
        .eq("device_id", deviceId)
        .eq("month", now.getMonth() + 1)
        .eq("year", now.getFullYear()).single()
      if (data) { setCanSpinRoulette(false); return }
    } catch { /* Allow spin on error */ }

    setRouletteSpinning(true)
    const userCity = getEffectiveLocation() || "Nationwide"
    const roll = Math.random()
    const won = roll < 0.05
    const consolation = !won && roll < 0.20

    let prize: string | undefined
    let prizeCity: string | undefined

    try {
      const supabase = await getSupabase()
      if (won) {
        const { data: localPrize } = await supabase
          .from("roulette_prizes").select("prize_name, prize_description, city")
          .eq("prize_type", "grand").eq("is_active", true)
          .ilike("city", `%${userCity.split(",")[0].trim()}%`)
          .limit(1).single()
        if (localPrize) {
          prize = `${localPrize.prize_name} in ${localPrize.city}`
          prizeCity = localPrize.city
        } else {
          const { data: anyPrize } = await supabase
            .from("roulette_prizes").select("prize_name, city")
            .eq("prize_type", "grand").eq("is_active", true)
            .limit(1).single()
          prize = anyPrize ? `${anyPrize.prize_name} in ${anyPrize.city}` : "Tasting Menu for Two"
          prizeCity = anyPrize?.city
        }
      } else if (consolation) {
        prize = "Free Dessert at Partner Restaurant"
      }

      await supabase.from("roulette_spins").insert({
        device_id: deviceId,
        spin_result: won || consolation ? "win" : "lose",
        prize: prize || null, location: userCity,
      })
    } catch {
      prize = won ? "Tasting Menu for Two" : consolation ? "Free Dessert at Partner Restaurant" : undefined
    }

    setTimeout(() => {
      setRouletteSpinning(false)
      setRouletteResult({ won: won || consolation, prize, city: prizeCity })
      setCanSpinRoulette(false)
    }, 3000)
  }

  return { rouletteSpinning, rouletteResult, canSpinRoulette, spinRoulette, setRouletteResult }
}
