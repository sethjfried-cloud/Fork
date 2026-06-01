"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "fork_dietary"

export function useDietaryFilters() {
  const [active, setActive] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setActive(JSON.parse(stored))
    } catch { /* corrupted, start fresh */ }
  }, [])

  const toggle = useCallback((value: string) => {
    setActive(prev => {
      const updated = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const isActive = useCallback((value: string) => active.includes(value), [active])

  return { active, toggle, isActive }
}
