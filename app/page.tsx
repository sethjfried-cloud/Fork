"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Restaurant, GroupSession, Participant, Screen } from "@/lib/types"
import { VIBE_CARDS, DRINKS_OPTIONS } from "@/lib/constants"
import { shuffleArray, getDeviceId, geocodeLocation } from "@/lib/utils"

import { OrderModal } from "@/components/OrderModal"
import { LocationScreen } from "@/components/screens/LocationScreen"
import { QuizScreen } from "@/components/screens/QuizScreen"
import { DrinksFlowScreen } from "@/components/screens/DrinksFlowScreen"
import { LoadingScreen } from "@/components/screens/LoadingScreen"
import { SingleResultScreen } from "@/components/screens/SingleResultScreen"
import { NoMoreScreen } from "@/components/screens/NoMoreScreen"
import { ErrorScreen } from "@/components/screens/ErrorScreen"
import { GroupSetupScreen } from "@/components/screens/GroupSetupScreen"
import { GroupLobbyScreen } from "@/components/screens/GroupLobbyScreen"
import { GroupVotingScreen } from "@/components/screens/GroupVotingScreen"
import { GroupResultScreen } from "@/components/screens/GroupResultScreen"
import { RouletteScreen } from "@/components/screens/RouletteScreen"
import { DropScreen } from "@/components/screens/DropScreen"

export default function Home() {
  const supabaseRef = useRef<SupabaseClient | null>(null)

  const getSupabase = useCallback(async () => {
    if (!supabaseRef.current) {
      const { createClient } = await import("@/lib/supabase/client")
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  // Core state
  const [screen, setScreen] = useState<Screen>("location")
  const [cityIn, setCityIn] = useState("")
  const [city, setCity] = useState("")
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [approximate, setApproximate] = useState(false)
  const [cardIdx, setCardIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [results, setResults] = useState<Restaurant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [orderModal, setOrderModal] = useState<Restaurant | null>(null)

  // Single-card result state
  const [currentResultIdx, setCurrentResultIdx] = useState(0)
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null)
  const [showSwipeHint, setShowSwipeHint] = useState(true)

  // Slot machine loading
  const [slotSpinning, setSlotSpinning] = useState(false)

  // Group mode state
  const [groupSession, setGroupSession] = useState<GroupSession | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [groupVotes, setGroupVotes] = useState<Record<string, Record<string, "yes" | "no">>>({})
  const [joinCode, setJoinCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  // Roulette state
  const [rouletteSpinning, setRouletteSpinning] = useState(false)
  const [rouletteResult, setRouletteResult] = useState<{ won: boolean; prize?: string; city?: string } | null>(null)
  const [canSpinRoulette, setCanSpinRoulette] = useState(true)

  // Fork Drop state
  const [activeDrop, setActiveDrop] = useState<{
    id: string
    restaurant_name: string
    description: string
    city: string
    image_url?: string
    ends_at: string
  } | null>(null)
  const [dropClaimed, setDropClaimed] = useState(false)
  const [dropTimeLeft, setDropTimeLeft] = useState("")

  const startX = useRef(0)
  const hasSelected = useRef(false)

  // ── Derived ──
  function getEffectiveLocation(): string {
    const manualInput = cityIn.trim()
    if (manualInput) return manualInput
    return city || "New York"
  }

  const currentRestaurant = results[currentResultIdx]

  // ── Effects ──

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("fork_swiped")) {
      setShowSwipeHint(false)
    }
  }, [])

  // Auto-detect GPS
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
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
          } catch { /* Fallback - coords are still set */ }
        },
        () => { /* GPS denied */ },
        { enableHighAccuracy: true, timeout: 5000 },
      )
    }
  }, [])

  // Fetch active Fork Drop
  useEffect(() => {
    async function fetchActiveDrop() {
      try {
        const supabase = await getSupabase()
        const now = new Date().toISOString()
        const { data } = await supabase
          .from("fork_drops")
          .select("*")
          .lte("starts_at", now)
          .gte("ends_at", now)
          .order("starts_at", { ascending: false })
          .limit(1)
          .single()

        if (data) {
          setActiveDrop(data)
          const deviceId = getDeviceId()
          if (deviceId) {
            const { data: claim } = await supabase
              .from("drop_claims")
              .select("id")
              .eq("drop_id", data.id)
              .eq("device_id", deviceId)
              .single()
            setDropClaimed(!!claim)
          }
        }
      } catch { /* No active drop */ }
    }
    fetchActiveDrop()
  }, [getSupabase])

  // Drop countdown
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

  // Group join code from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const joinParam = params.get("join")
      if (joinParam) {
        setJoinCode(joinParam.toUpperCase())
        setScreen("group-join")
        window.history.replaceState({}, "", window.location.pathname)
      }
    }
  }, [])

  // ── Restaurant fetching ──

  async function fetchWithParams(params: {
    location: string
    categories: string
    shuffle?: boolean
  }) {
    const loc = params.location
    const locationCoords = coords || await geocodeLocation(loc, coords, cityIn)

    const res = await fetch("/api/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: loc,
        neighborhood: loc.split(",")[0].trim().toLowerCase(),
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
        categories: params.categories,
        price: "1,2,3",
        sort_by: "rating",
        limit: 20,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Something went wrong")

    const restaurants = params.shuffle ? shuffleArray(data.restaurants) : data.restaurants
    setResults(restaurants)
    setCurrentResultIdx(0)
    setApproximate(data.approximate || false)
  }

  async function justGo(c?: string) {
    const loc = c || getEffectiveLocation()
    setCity(loc)
    setScreen("loading")
    setSlotSpinning(true)
    try {
      await fetchWithParams({ location: loc, categories: "restaurants", shuffle: true })
      setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
    } catch (e: any) {
      setError(e.message); setSlotSpinning(false); setScreen("results")
    }
  }

  async function fetchRestaurants(finalAnswers: Record<string, string>) {
    try {
      const energyOption = VIBE_CARDS[0].options.find(o => o.value === finalAnswers.energy)
      const partyOption = VIBE_CARDS[1].options.find(o => o.value === finalAnswers.appetite)
      const categories = energyOption?.categories || partyOption?.categories || "restaurants"
      const loc = getEffectiveLocation()
      await fetchWithParams({ location: loc, categories })
      setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
    } catch (e: any) {
      setError(e.message); setSlotSpinning(false); setScreen("results")
    }
  }

  async function rollAgain() {
    setSlotSpinning(true)
    const energyOption = VIBE_CARDS[0].options.find(o => o.value === answers.energy)
    const partyOption = VIBE_CARDS[1].options.find(o => o.value === answers.party)
    const categories = energyOption?.categories || partyOption?.categories || "restaurants"
    try {
      await fetchWithParams({ location: getEffectiveLocation(), categories, shuffle: true })
      setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
    } catch (e: any) {
      setError(e.message); setSlotSpinning(false); setScreen("results")
    }
  }

  // ── Quiz navigation ──

  function startQuiz(c?: string) {
    const loc = c || getEffectiveLocation()
    setCity(loc)
    setCardIdx(0); setAnswers({}); setSelected(null)
    setAnimKey(0); setDragX(0); setError(null)
    hasSelected.current = false
    setScreen("quiz")
  }

  function goBack() {
    if (cardIdx === 0) { setScreen("location"); return }
    setCardIdx(i => i - 1)
    setAnimKey(k => k + 1)
    setSelected(null)
    hasSelected.current = false
  }

  async function advance(key: string, value: string) {
    if (hasSelected.current) return
    hasSelected.current = true
    setSelected(value)
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)

    setTimeout(async () => {
      setSelected(null)
      hasSelected.current = false
      if (key === "energy" && value === "drinks") { setScreen("drinks-flow"); return }
      if (cardIdx < VIBE_CARDS.length - 1) {
        setCardIdx(i => i + 1)
        setAnimKey(k => k + 1)
      } else {
        setScreen("loading"); setSlotSpinning(true)
        await fetchRestaurants(newAnswers)
      }
    }, 320)
  }

  async function selectDrinksOption(value: string) {
    if (hasSelected.current) return
    hasSelected.current = true
    setSelected(value)
    const drinkOption = DRINKS_OPTIONS.find(o => o.value === value)
    setAnswers(prev => ({ ...prev, drinks: value }))

    setTimeout(async () => {
      setSelected(null)
      hasSelected.current = false
      const loc = getEffectiveLocation()
      setCity(loc)
      setScreen("loading"); setSlotSpinning(true)
      try {
        await fetchWithParams({ location: loc, categories: drinkOption?.categories || "bars" })
        setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
      } catch (e: any) {
        setError(e.message); setSlotSpinning(false); setScreen("results")
      }
    }, 320)
  }

  // ── Swipe handlers ──

  function onSwipeStart(clientX: number) { startX.current = clientX; setDragging(true) }
  function onSwipeMove(clientX: number) { if (dragging) setDragX(clientX - startX.current) }
  function onSwipeEnd() {
    setDragging(false)
    if (dragX > 80) handleAccept()
    else if (dragX < -80) handleReject()
    setDragX(0)
  }

  function handleAccept() {
    const restaurant = results[currentResultIdx]
    if (!restaurant) return
    if (showSwipeHint) { setShowSwipeHint(false); localStorage.setItem("fork_swiped", "true") }
    setSwipeDir("right")
    setTimeout(() => { setSwipeDir(null); setOrderModal(restaurant) }, 300)
  }

  function handleReject() {
    if (showSwipeHint) { setShowSwipeHint(false); localStorage.setItem("fork_swiped", "true") }
    setSwipeDir("left")
    setTimeout(() => {
      setSwipeDir(null)
      if (currentResultIdx < results.length - 1) setCurrentResultIdx(i => i + 1)
      else setScreen("no-more")
    }, 300)
  }

  // ── Lottery ──

  async function submitLotteryEntry(restaurant: Restaurant) {
    const deviceId = getDeviceId()
    if (!deviceId) return
    try {
      const supabase = await getSupabase()
      await supabase.from("lottery_entries").insert({
        device_id: deviceId,
        restaurant_name: restaurant.name,
        restaurant_id: restaurant.id,
        location: getEffectiveLocation(),
      })
    } catch { /* Silently fail */ }
  }

  function handleOrderClick(restaurant: Restaurant) {
    submitLotteryEntry(restaurant)
    setOrderModal(null)
  }

  // ── Roulette ──

  async function spinRoulette() {
    const deviceId = getDeviceId()
    if (!deviceId || rouletteSpinning) return

    // Check eligibility
    try {
      const supabase = await getSupabase()
      const now = new Date()
      const { data } = await supabase
        .from("roulette_spins")
        .select("id")
        .eq("device_id", deviceId)
        .eq("month", now.getMonth() + 1)
        .eq("year", now.getFullYear())
        .single()
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
        prize: prize || null,
        location: userCity,
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

  // ── Fork Drop ──

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

  // ── Group mode ──

  function getShareLink() {
    if (typeof window === "undefined" || !groupSession) return ""
    return `${window.location.origin}?join=${groupSession.code}`
  }

  async function copyShareLink() {
    const link = getShareLink()
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      const input = document.createElement("input")
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
    }
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async function subscribeToSession(sessionId: string) {
    const supabase = await getSupabase()
    supabase
      .channel(`session-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_sessions", filter: `id=eq.${sessionId}` }, (payload) => {
        const newSession = payload.new as GroupSession
        setGroupSession(newSession)
        if (newSession.status === "voting") {
          setResults(newSession.restaurants || [])
          setCurrentResultIdx(0)
          setScreen("group-voting")
        } else if (newSession.status === "complete" && newSession.final_pick) {
          setScreen("group-result")
        }
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
          checkForConsensus(sessionId, voteMap)
        }
      })
      .subscribe()

    const { data } = await supabase.from("group_participants").select("*").eq("session_id", sessionId)
    if (data) setParticipants(data)
  }

  async function checkForConsensus(sessionId: string, votes: Record<string, Record<string, "yes" | "no">>) {
    if (!groupSession || participants.length === 0) return
    const restaurants = groupSession.restaurants || results
    for (const restaurant of restaurants) {
      const restaurantVotes = votes[restaurant.id] || {}
      const yesVotes = Object.values(restaurantVotes).filter(v => v === "yes").length
      if (yesVotes === participants.length) {
        const supabase = await getSupabase()
        await supabase.from("group_sessions").update({ status: "complete", final_pick: restaurant }).eq("id", sessionId)
        return
      }
    }
  }

  async function createGroupSession() {
    const loc = getEffectiveLocation()
    if (!playerName.trim()) return
    const code = generateCode()
    const supabase = await getSupabase()

    const { data: session, error: sessionError } = await supabase
      .from("group_sessions").insert({ code, location: loc, host_name: playerName, status: "waiting", restaurants: [] })
      .select().single()
    if (sessionError || !session) { setError("Failed to create group session"); return }

    const { data: participantData, error: participantError } = await supabase
      .from("group_participants").insert({ session_id: session.id, name: playerName, is_host: true })
      .select().single()
    if (participantError || !participantData) { setError("Failed to join session"); return }

    setGroupSession(session); setParticipant(participantData); setCity(loc)
    setScreen("group-lobby"); subscribeToSession(session.id)
  }

  async function joinGroupSession() {
    if (!joinCode.trim() || !playerName.trim()) return
    const supabase = await getSupabase()

    const { data: session, error: sessionError } = await supabase
      .from("group_sessions").select("*").eq("code", joinCode.toUpperCase()).single()
    if (sessionError || !session) { setError("Session not found"); return }

    const { data: participantData, error: participantError } = await supabase
      .from("group_participants").insert({ session_id: session.id, name: playerName, is_host: false })
      .select().single()
    if (participantError || !participantData) { setError("Failed to join session"); return }

    setGroupSession(session); setParticipant(participantData); setCity(session.location)
    setScreen(session.status === "voting" ? "group-voting" : "group-lobby")
    subscribeToSession(session.id)
  }

  async function startGroupVoting() {
    if (!groupSession || !participant?.is_host) return
    setScreen("loading"); setSlotSpinning(true)
    try {
      const locationCoords = coords || await geocodeLocation(groupSession.location, coords, cityIn)
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    if (currentResultIdx < results.length - 1) setCurrentResultIdx(i => i + 1)
  }

  // ── Render ──

  const dark: React.CSSProperties = { padding: "28px 24px 36px", background: "#0D0D0D", minHeight: "100dvh" }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0D0D0D; }
        .fork-serif { font-family: var(--font-dm-serif), Georgia, serif !important; }
        .fork-sans  { font-family: var(--font-dm-sans), -apple-system, sans-serif !important; }
        @keyframes slideIn { from { transform: translateX(52px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes fadeUp  { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes bob     { 0%,100% { transform: translateY(0); opacity: .35 } 50% { transform: translateY(-9px); opacity: 1 } }
        @keyframes shake   { 0%,100% { transform: rotate(0deg) } 25% { transform: rotate(-8deg) } 75% { transform: rotate(8deg) } }
        @keyframes pulse   { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @keyframes spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0 } 50% { transform: scale(1.05) } 70% { transform: scale(0.9) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes swipeLeft { to { transform: translateX(-150%) rotate(-20deg); opacity: 0 } }
        @keyframes swipeRight { to { transform: translateX(150%) rotate(20deg); opacity: 0 } }
        .card-in { animation: slideIn .28s cubic-bezier(.22,1,.36,1) forwards; }
        .fade-in { animation: fadeUp .35s ease forwards; }
        .bounce-in { animation: bounceIn .5s cubic-bezier(.22,1,.36,1) forwards; }
        .swipe-left { animation: swipeLeft .3s ease forwards; }
        .swipe-right { animation: swipeRight .3s ease forwards; }
        .bob-1 { animation: bob 1s ease-in-out infinite; }
        .bob-2 { animation: bob 1s ease-in-out .15s infinite; }
        .bob-3 { animation: bob 1s ease-in-out .3s infinite; }
        .opt:hover:not(:disabled) { border-color: #FF5C35 !important; color: #FF5C35 !important; }
        .pill:hover { border-color: #444 !important; color: #CCC !important; }
        .gps:hover { border-color: #333 !important; }
        .order:hover { opacity: .85; }
        .action-btn:hover { transform: scale(1.05); }
        .delivery-app:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,.3); }
        .modal-overlay { animation: fadeIn .2s ease forwards; }
        .modal-content { animation: slideUp .3s cubic-bezier(.22,1,.36,1) forwards; }
        input { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="fork-sans" style={{ display: "flex", justifyContent: "center", minHeight: "100dvh", background: "#0D0D0D" }}>
        <div style={{ width: "100%", maxWidth: 390 }}>

          {screen === "location" && (
            <LocationScreen
              cityIn={cityIn} setCityIn={setCityIn} setCoords={setCoords}
              justGo={justGo} startQuiz={startQuiz} setScreen={setScreen}
              activeDrop={activeDrop} dropTimeLeft={dropTimeLeft} dark={dark}
            />
          )}

          {screen === "quiz" && (
            <QuizScreen
              cardIdx={cardIdx} animKey={animKey} selected={selected}
              goBack={goBack} advance={advance}
            />
          )}

          {screen === "drinks-flow" && (
            <DrinksFlowScreen
              city={city} selected={selected}
              onBack={() => { setScreen("quiz"); setCardIdx(0) }}
              selectDrinksOption={selectDrinksOption}
            />
          )}

          {screen === "loading" && (
            <LoadingScreen slotSpinning={slotSpinning} dark={dark} />
          )}

          {screen === "single-result" && !currentRestaurant && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
              <div style={{ fontSize: 56, marginBottom: 20 }}>🍽️</div>
              <h2 className="fork-serif" style={{ fontSize: 24, fontWeight: 400, color: "#fff", marginBottom: 12 }}>Nothing nearby</h2>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 28, maxWidth: 260, lineHeight: 1.5 }}>
                We couldn&apos;t find open spots in your area. Try a different neighborhood or widen your search.
              </p>
              <button onClick={() => setScreen("location")} style={{ background: "#FF5C35", border: "none", borderRadius: 14, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                Try again
              </button>
            </div>
          )}

          {screen === "single-result" && currentRestaurant && (
            <SingleResultScreen
              currentRestaurant={currentRestaurant} currentResultIdx={currentResultIdx}
              totalResults={results.length} approximate={approximate}
              swipeDir={swipeDir} dragX={dragX} dragging={dragging} showSwipeHint={showSwipeHint}
              onSwipeStart={onSwipeStart} onSwipeMove={onSwipeMove} onSwipeEnd={onSwipeEnd}
              handleAccept={handleAccept} handleReject={handleReject}
              setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "no-more" && (
            <NoMoreScreen rollAgain={rollAgain} setScreen={setScreen} dark={dark} />
          )}

          {screen === "results" && (
            <ErrorScreen error={error} setScreen={setScreen} setError={setError} dark={dark} />
          )}

          {screen === "group-setup" && (
            <GroupSetupScreen
              playerName={playerName} setPlayerName={setPlayerName}
              cityIn={cityIn} setCityIn={setCityIn}
              joinCode={joinCode} setJoinCode={setJoinCode}
              error={error} createGroupSession={createGroupSession}
              joinGroupSession={joinGroupSession} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "group-lobby" && groupSession && (
            <GroupLobbyScreen
              groupSession={groupSession} participant={participant}
              participants={participants} linkCopied={linkCopied}
              getShareLink={getShareLink} copyShareLink={copyShareLink}
              startGroupVoting={startGroupVoting}
              setGroupSession={setGroupSession} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "group-voting" && currentRestaurant && groupSession && (
            <GroupVotingScreen
              currentRestaurant={currentRestaurant} currentResultIdx={currentResultIdx}
              totalResults={results.length} groupSession={groupSession}
              participant={participant} participants={participants}
              groupVotes={groupVotes} submitGroupVote={submitGroupVote} dark={dark}
            />
          )}

          {screen === "group-result" && groupSession?.final_pick && (
            <GroupResultScreen
              groupSession={groupSession} setOrderModal={setOrderModal}
              setGroupSession={setGroupSession} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "roulette" && (
            <RouletteScreen
              rouletteSpinning={rouletteSpinning} rouletteResult={rouletteResult}
              canSpinRoulette={canSpinRoulette} spinRoulette={spinRoulette}
              setRouletteResult={setRouletteResult} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "drop" && activeDrop && (
            <DropScreen
              activeDrop={activeDrop} dropClaimed={dropClaimed}
              dropTimeLeft={dropTimeLeft} claimDrop={claimDrop}
              setScreen={setScreen} dark={dark}
            />
          )}

        </div>
      </div>

      {orderModal && (
        <OrderModal
          restaurant={orderModal}
          onClose={() => setOrderModal(null)}
          onOrderClick={handleOrderClick}
        />
      )}
    </>
  )
}
