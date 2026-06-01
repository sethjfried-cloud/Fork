"use client"

import { useState, useEffect, useCallback } from "react"
import type { Restaurant } from "@/lib/types"

const STORAGE_KEY = "fork_favorites"

export function useFavorites() {
  const [favorites, setFavorites] = useState<Restaurant[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFavorites(JSON.parse(stored))
    } catch { /* corrupted data, start fresh */ }
  }, [])

  const addFavorite = useCallback((restaurant: Restaurant) => {
    setFavorites(prev => {
      if (prev.some(r => r.id === restaurant.id)) return prev
      const updated = [restaurant, ...prev]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.filter(r => r.id !== id)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const isFavorite = useCallback((id: string) => {
    return favorites.some(r => r.id === id)
  }, [favorites])

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
