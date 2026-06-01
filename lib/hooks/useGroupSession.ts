"use client"

import React, { useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Restaurant, GroupSession, Participant, Screen } from "@/lib/types"
import { geocodeLocation } from "@/lib/utils"

type GroupCallbacks = {
  getSupabase: () => Promise<SupabaseClient>
  coords: { lat: number; lng: number } | null
  cityIn: string
  getEffectiveLocation: () => string
  setResults: (r: Restaurant[]) => void
  setCurrentResultIdx: React.Dispatch<React.SetStateAction<number>>
  setScreen: (s: Screen) => void
  setSlotSpinning: (b: boolean) => void
  setCity: (c: string) => void
  setError: (e: string | null) => void
}

export function useGroupSession({
  getSupabase, coords, cityIn, getEffectiveLocation,
  setResults, setCurrentResultIdx, setScreen, setSlotSpinning, setCity, setError,
}: GroupCallbacks) {
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [groupVotes, setGroupVotes] = useState<Record<string, Record<string, "yes" | "no">>>({})
  const [joinCode, setJoinCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  function getShareLink() {
    if (typeof window === "undefined" || !groupSession) return ""
    return `${window.location.origin}?join=${groupSession.code}`
  }

  async function copyShareLink() {
    const link = getShareLink()
    try { await navigator.clipboard.writeText(link) } catch {
      const input = document.createElement("input")
      input.value = link; document.body.appendChild(input)
      input.select(); document.execCommand("copy"); document.body.removeChild(input)
    }
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000)
  }

  async function subscribeToSession(sessionId: string, results: Restaurant[]) {
    const supabase = await getSupabase()
    supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_sessions", filter: `id=eq.${sessionId}` }, (payload) => {
        const s = payload.new as GroupSession
        setGroupSession(s)
        if (s.status === "voting") { setResults(s.restaurants || []); setCurrentResultIdx(0); setScreen("group-voting") }
        else if (s.status === "complete" && s.final_pick) setScreen("group-result")
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_participants", filter: `session_id=eq.${sessionId}` }, async () => {
        const sb = await getSupabase()
        const { data } = await sb.from("group_participants").select("*").eq("session_id", sessionId)
        if (data) setParticipants(data)
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_votes", filter: `session_id=eq.${sessionId}` }, async () => {
        const sb = await getSupabase()
        const { data } = await sb.from("group_votes").select("*").eq("session_id", sessionId)
        if (data) {
          const voteMap: Record<string, Record<string, "yes" | "no">> = {}
          data.forEach((v: any) => {
            if (!voteMap[v.restaurant_id]) voteMap[v.restaurant_id] = {}
            voteMap[v.restaurant_id][v.participant_id] = v.vote
          })
          setGroupVotes(voteMap)
          // Check consensus
          const gs = groupSession
          if (gs && participants.length > 0) {
            const restaurants = gs.restaurants || results
            for (const restaurant of restaurants) {
              const rv = voteMap[restaurant.id] || {}
              if (Object.values(rv).filter(v => v === "yes").length === participants.length) {
                const sb2 = await getSupabase()
                await sb2.from("group_sessions").update({ status: "complete", final_pick: restaurant }).eq("id", sessionId)
                return
              }
            }
          }
        }
      })
      .subscribe()

    const { data } = await supabase.from("group_participants").select("*").eq("session_id", sessionId)
    if (data) setParticipants(data)
  }

  async function createGroupSession() {
    const loc = getEffectiveLocation()
    if (!playerName.trim()) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const supabase = await getSupabase()

    const { data: session, error: err } = await supabase
      .from("group_sessions").insert({ code, location: loc, host_name: playerName, status: "waiting", restaurants: [] })
      .select().single()
    if (err || !session) { setError("Failed to create group session"); return }

    const { data: pd, error: pe } = await supabase
      .from("group_participants").insert({ session_id: session.id, name: playerName, is_host: true })
      .select().single()
    if (pe || !pd) { setError("Failed to join session"); return }

    setGroupSession(session); setParticipant(pd); setCity(loc)
    setScreen("group-lobby"); subscribeToSession(session.id, [])
  }

  async function joinGroupSession() {
    if (!joinCode.trim() || !playerName.trim()) return
    const supabase = await getSupabase()

    const { data: session, error: err } = await supabase
      .from("group_sessions").select("*").eq("code", joinCode.toUpperCase()).single()
    if (err || !session) { setError("Session not found"); return }

    const { data: pd, error: pe } = await supabase
      .from("group_participants").insert({ session_id: session.id, name: playerName, is_host: false })
      .select().single()
    if (pe || !pd) { setError("Failed to join session"); return }

    setGroupSession(session); setParticipant(pd); setCity(session.location)
    setScreen(session.status === "voting" ? "group-voting" : "group-lobby")
    subscribeToSession(session.id, session.restaurants || [])
  }

  async function startGroupVoting() {
    if (!groupSession || !participant?.is_host) return
    setScreen("loading"); setSlotSpinning(true)
    try {
      const locationCoords = coords || await geocodeLocation(groupSession.location, coords, cityIn)
      const res = await fetch("/api/restaurants", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: groupSession.location,
          neighborhood: groupSession.location.split(",")[0].trim().toLowerCase(),
          latitude: locationCoords?.lat, longitude: locationCoords?.lng,
          categories: "restaurants", price: "1,2,3", sort_by: "rating", limit: 20,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Something went wrong")

      const supabase = await getSupabase()
      await supabase.from("group_sessions").update({ status: "voting", restaurants: data.restaurants }).eq("id", groupSession.id)
      setResults(data.restaurants)
      setTimeout(() => setSlotSpinning(false), 1500)
    } catch (e: any) {
      setError(e.message); setSlotSpinning(false); setScreen("group-lobby")
    }
  }

  async function submitGroupVote(restaurantId: string, vote: "yes" | "no") {
    if (!groupSession || !participant) return
    const supabase = await getSupabase()
    await supabase.from("group_votes").upsert(
      { session_id: groupSession.id, participant_id: participant.id, restaurant_id: restaurantId, vote },
      { onConflict: "session_id,participant_id,restaurant_id" },
    )
    setCurrentResultIdx((prev: number) => prev + 1)
  }

  return {
    groupSession, setGroupSession, participant, participants,
    groupVotes, joinCode, setJoinCode, playerName, setPlayerName,
    linkCopied, getShareLink, copyShareLink,
    createGroupSession, joinGroupSession, startGroupVoting, submitGroupVote,
  }
}
