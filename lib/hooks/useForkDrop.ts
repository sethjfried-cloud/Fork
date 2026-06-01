"use client"

import { useState, useEffect } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getDeviceId } from "@/lib/utils"

export type ActiveDrop = {
  id: string
  restaurant_name: string
  description: string
  city: string
  image_url?: string
  ends_at: string
}

export function useForkDrop(getSupabase: () => Promise<SupabaseClient>) {
  const [activeDrop, setActiveDrop] = useState<ActiveDrop | null>(null)
  const [dropClaimed, setDropClaimed] = useState(false)
  const [dropTimeLeft, setDropTimeLeft] = useState("")

  // Fetch active drop on mount
  useEffect(() => {
    async function fetchActiveDrop() {
      try {
        const supabase = await getSupabase()
        const now = new Date().toISOString()
        const { data } = await supabase
          .from("fork_drops").select("*")
          .lte("starts_at", now).gte("ends_at", now)
          .order("starts_at", { ascending: false })
          .limit(1).single()

        if (data) {
          setActiveDrop(data)
          const deviceId = getDeviceId()
          if (deviceId) {
            const { data: claim } = await supabase
              .from("drop_claims").select("id")
              .eq("drop_id", data.id).eq("device_id", deviceId).single()
            setDropClaimed(!!claim)
          }
        }
      } catch { /* No active drop */ }
    }
    fetchActiveDrop()
  }, [getSupabase])

  // Countdown timer
  useEffect(() => {
    if (!activeDrop) return
    function updateCountdown() {
      if (!activeDrop) return
      const diff = new Date(activeDrop.ends_at).getTime() - Date.now()
      if (diff <= 0) { setDropTimeLeft("Ended"); return }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setDropTimeLeft(`${hours}h ${mins}m left`)
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [activeDrop])

  async function claimDrop() {
    if (!activeDrop || dropClaimed) return
    const deviceId = getDeviceId()
    if (!deviceId) return
    try {
      const supabase = await getSupabase()
      await supabase.from("drop_claims").insert({ drop_id: activeDrop.id, device_id: deviceId })
      setDropClaimed(true)
    } catch { /* Claim failed */ }
  }

  return { activeDrop, dropClaimed, dropTimeLeft, claimDrop }
}
