"use client"

import { useState, useEffect } from "react"

export function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [cityIn, setCityIn] = useState("")

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lng: longitude })
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const neighborhood = data.address?.suburb || data.address?.neighbourhood || ""
          const c = data.address?.city || data.address?.town || data.address?.village || ""
          const loc = neighborhood ? `${neighborhood}, ${c}` : c
          setCityIn(loc)
        } catch { /* coords still set */ }
      },
      () => { /* GPS denied */ },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }, [])

  return { coords, setCoords, cityIn, setCityIn }
}
