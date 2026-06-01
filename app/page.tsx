"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Restaurant, Screen } from "@/lib/types"
import { VIBE_CARDS, DRINKS_OPTIONS } from "@/lib/constants"
import { shuffleArray, getDeviceId, geocodeLocation } from "@/lib/utils"

// Hooks
import { useGeolocation } from "@/lib/hooks/useGeolocation"
import { useFavorites } from "@/lib/hooks/useFavorites"
import { useForkDrop } from "@/lib/hooks/useForkDrop"
import { useRoulette } from "@/lib/hooks/useRoulette"
import { useSwipe } from "@/lib/hooks/useSwipe"
import { useGroupSession } from "@/lib/hooks/useGroupSession"

// Components
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
import { FavoritesScreen } from "@/components/screens/FavoritesScreen"

export default function Home() {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = useCallback(async () => {
    if (!supabaseRef.current) {
      const { createClient } = await import("@/lib/supabase/client")
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])

  // ── Screen state ──
  const [screen, setScreen] = useState<Screen>("location")
  const [city, setCity] = useState("")

  // ── Restaurant state ──
  const [results, setResults] = useState<Restaurant[]>([])
  const [currentResultIdx, setCurrentResultIdx] = useState(0)
  const [approximate, setApproximate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slotSpinning, setSlotSpinning] = useState(false)
  const [orderModal, setOrderModal] = useState<Restaurant | null>(null)

  // ── Quiz state ──
  const [cardIdx, setCardIdx] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const hasSelected = useRef(false)

  // ── Hooks ──
  const { coords, setCoords, cityIn, setCityIn } = useGeolocation()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { activeDrop, dropClaimed, dropTimeLeft, claimDrop } = useForkDrop(getSupabase)

  function getEffectiveLocation(): string {
    const manualInput = cityIn.trim()
    if (manualInput) return manualInput
    return city || "New York"
  }

  const roulette = useRoulette(getSupabase, getEffectiveLocation)

  const currentRestaurant = results[currentResultIdx]

  const swipe = useSwipe({
    onAccept: () => {
      const r = results[currentResultIdx]
      if (r) {
        addFavorite(r)
        setOrderModal(r)
      }
    },
    onReject: () => {
      if (currentResultIdx < results.length - 1) setCurrentResultIdx(i => i + 1)
      else setScreen("no-more")
    },
  })

  const group = useGroupSession({
    getSupabase, coords, cityIn, getEffectiveLocation,
    setResults, setCurrentResultIdx: (n) => setCurrentResultIdx(n),
    setScreen, setSlotSpinning, setCity, setError,
  })

  // ── URL join code ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const joinParam = params.get("join")
      if (joinParam) {
        group.setJoinCode(joinParam.toUpperCase())
        setScreen("group-join")
        window.history.replaceState({}, "", window.location.pathname)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restaurant fetching ──

  async function fetchWithParams(params: { location: string; categories: string; shuffle?: boolean }) {
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
    setCity(loc); setScreen("loading"); setSlotSpinning(true)
    try {
      await fetchWithParams({ location: loc, categories: "restaurants", shuffle: true })
      setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
    } catch (e: any) { setError(e.message); setSlotSpinning(false); setScreen("results") }
  }

  async function fetchRestaurants(finalAnswers: Record<string, string>) {
    try {
      const energyOption = VIBE_CARDS[0].options.find(o => o.value === finalAnswers.energy)
      const partyOption = VIBE_CARDS[1].options.find(o => o.value === finalAnswers.appetite)
      const categories = energyOption?.categories || partyOption?.categories || "restaurants"
      await fetchWithParams({ location: getEffectiveLocation(), categories })
      setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
    } catch (e: any) { setError(e.message); setSlotSpinning(false); setScreen("results") }
  }

  async function rollAgain() {
    setSlotSpinning(true)
    const energyOption = VIBE_CARDS[0].options.find(o => o.value === answers.energy)
    const partyOption = VIBE_CARDS[1].options.find(o => o.value === answers.party)
    const categories = energyOption?.categories || partyOption?.categories || "restaurants"
    try {
      await fetchWithParams({ location: getEffectiveLocation(), categories, shuffle: true })
      setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
    } catch (e: any) { setError(e.message); setSlotSpinning(false); setScreen("results") }
  }

  // ── Quiz ──

  function startQuiz(c?: string) {
    const loc = c || getEffectiveLocation()
    setCity(loc); setCardIdx(0); setAnswers({}); setSelected(null)
    setAnimKey(0); setError(null); hasSelected.current = false
    setScreen("quiz")
  }

  function goBack() {
    if (cardIdx === 0) { setScreen("location"); return }
    setCardIdx(i => i - 1); setAnimKey(k => k + 1)
    setSelected(null); hasSelected.current = false
  }

  async function advance(key: string, value: string) {
    if (hasSelected.current) return
    hasSelected.current = true; setSelected(value)
    const newAnswers = { ...answers, [key]: value }; setAnswers(newAnswers)
    setTimeout(async () => {
      setSelected(null); hasSelected.current = false
      if (key === "energy" && value === "drinks") { setScreen("drinks-flow"); return }
      if (cardIdx < VIBE_CARDS.length - 1) { setCardIdx(i => i + 1); setAnimKey(k => k + 1) }
      else { setScreen("loading"); setSlotSpinning(true); await fetchRestaurants(newAnswers) }
    }, 320)
  }

  async function selectDrinksOption(value: string) {
    if (hasSelected.current) return
    hasSelected.current = true; setSelected(value)
    const drinkOption = DRINKS_OPTIONS.find(o => o.value === value)
    setAnswers(prev => ({ ...prev, drinks: value }))
    setTimeout(async () => {
      setSelected(null); hasSelected.current = false
      const loc = getEffectiveLocation(); setCity(loc)
      setScreen("loading"); setSlotSpinning(true)
      try {
        await fetchWithParams({ location: loc, categories: drinkOption?.categories || "bars" })
        setTimeout(() => { setSlotSpinning(false); setScreen("single-result") }, 1500)
      } catch (e: any) { setError(e.message); setSlotSpinning(false); setScreen("results") }
    }, 320)
  }

  // ── Lottery ──

  async function submitLotteryEntry(restaurant: Restaurant) {
    const deviceId = getDeviceId()
    if (!deviceId) return
    try {
      const supabase = await getSupabase()
      await supabase.from("lottery_entries").insert({
        device_id: deviceId, restaurant_name: restaurant.name,
        restaurant_id: restaurant.id, location: getEffectiveLocation(),
      })
    } catch { /* Silently fail */ }
  }

  function handleOrderClick(restaurant: Restaurant) {
    submitLotteryEntry(restaurant); setOrderModal(null)
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
              activeDrop={activeDrop} dropTimeLeft={dropTimeLeft}
              favoritesCount={favorites.length} dark={dark}
            />
          )}

          {screen === "favorites" && (
            <FavoritesScreen
              favorites={favorites} removeFavorite={removeFavorite}
              setOrderModal={setOrderModal} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "quiz" && (
            <QuizScreen cardIdx={cardIdx} animKey={animKey} selected={selected} goBack={goBack} advance={advance} />
          )}

          {screen === "drinks-flow" && (
            <DrinksFlowScreen city={city} selected={selected} onBack={() => { setScreen("quiz"); setCardIdx(0) }} selectDrinksOption={selectDrinksOption} />
          )}

          {screen === "loading" && (
            <LoadingScreen slotSpinning={slotSpinning} dark={dark} />
          )}

          {screen === "single-result" && !currentRestaurant && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
              <div style={{ fontSize: 56, marginBottom: 20 }}>🍽️</div>
              <h2 className="fork-serif" style={{ fontSize: 24, fontWeight: 400, color: "#fff", marginBottom: 12 }}>Nothing nearby</h2>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 28, maxWidth: 260, lineHeight: 1.5 }}>
                We couldn&apos;t find open spots in your area. Try a different neighborhood.
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
              swipeDir={swipe.swipeDir} dragX={swipe.dragX} dragging={swipe.dragging}
              showSwipeHint={swipe.showSwipeHint}
              isFavorite={isFavorite(currentRestaurant.id)}
              onSwipeStart={swipe.onSwipeStart} onSwipeMove={swipe.onSwipeMove} onSwipeEnd={swipe.onSwipeEnd}
              handleAccept={swipe.handleAccept} handleReject={swipe.handleReject}
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
              playerName={group.playerName} setPlayerName={group.setPlayerName}
              cityIn={cityIn} setCityIn={setCityIn}
              joinCode={group.joinCode} setJoinCode={group.setJoinCode}
              error={error} createGroupSession={group.createGroupSession}
              joinGroupSession={group.joinGroupSession} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "group-lobby" && group.groupSession && (
            <GroupLobbyScreen
              groupSession={group.groupSession} participant={group.participant}
              participants={group.participants} linkCopied={group.linkCopied}
              getShareLink={group.getShareLink} copyShareLink={group.copyShareLink}
              startGroupVoting={group.startGroupVoting}
              setGroupSession={group.setGroupSession} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "group-voting" && currentRestaurant && group.groupSession && (
            <GroupVotingScreen
              currentRestaurant={currentRestaurant} currentResultIdx={currentResultIdx}
              totalResults={results.length} groupSession={group.groupSession}
              participant={group.participant} participants={group.participants}
              groupVotes={group.groupVotes} submitGroupVote={group.submitGroupVote} dark={dark}
            />
          )}

          {screen === "group-result" && group.groupSession?.final_pick && (
            <GroupResultScreen
              groupSession={group.groupSession} setOrderModal={setOrderModal}
              setGroupSession={group.setGroupSession} setScreen={setScreen} dark={dark}
            />
          )}

          {screen === "roulette" && (
            <RouletteScreen
              rouletteSpinning={roulette.rouletteSpinning} rouletteResult={roulette.rouletteResult}
              canSpinRoulette={roulette.canSpinRoulette} spinRoulette={roulette.spinRoulette}
              setRouletteResult={roulette.setRouletteResult} setScreen={setScreen} dark={dark}
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
        <OrderModal restaurant={orderModal} onClose={() => setOrderModal(null)} onOrderClick={handleOrderClick} />
      )}
    </>
  )
}
