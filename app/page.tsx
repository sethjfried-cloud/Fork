"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

// Two quick questions - that's it
const VIBE_CARDS = [
  { 
    q: "What vibe?", 
    key: "energy",  
    options: [
      { label: "Loud & lively", value: "lively", categories: "bars,gastropubs,korean,mexican" },
      { label: "Chill", value: "quiet", categories: "cafes,italian,japanese,mediterranean" },
      { label: "Quick bite", value: "quick", categories: "fastfood,sandwiches,pizza,burgers" },
      { label: "Fancy", value: "upscale", categories: "steak,seafood,french,finedining" },
      { label: "Just drinks", value: "drinks", categories: "bars" },
    ]
  },
  { 
    q: "Solo or group?", 
    key: "party",
    options: [
      { label: "Just me", value: "solo", categories: "cafes,ramen,sushi,sandwiches" },
      { label: "With others", value: "group", categories: "korean,mexican,italian,tapas,pizza" },
    ]
  },
]

// Fisher-Yates shuffle for unbiased randomization
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Separate drinks flow
const DRINKS_OPTIONS = [
  { label: "Alcohol", value: "alcohol", categories: "bars,wine_bars,cocktailbars,pubs,breweries,beer_bar" },
  { label: "Non-alcoholic", value: "nonalc", categories: "coffee,bubbletea,juicebars,tea" },
  { label: "Both", value: "both", categories: "bars,cocktailbars,coffee,cafes" },
  { label: "Drinks + small bites", value: "bites", categories: "gastropubs,tapas,wine_bars,izakaya" },
]

const DELIVERY_APPS = [
  { name: "Uber Eats", color: "#06C167", priceHint: "Avg. fees: $3-5", getUrl: (name: string, address: string) => `https://www.ubereats.com/search?q=${encodeURIComponent(name + " " + address)}` },
  { name: "DoorDash", color: "#FF3008", priceHint: "Often cheapest", isCheapest: true, getUrl: (name: string, address: string) => `https://www.doordash.com/search/store/${encodeURIComponent(name)}/` },
  { name: "Grubhub", color: "#F63440", priceHint: "Free delivery deals", getUrl: (name: string, address: string) => `https://www.grubhub.com/search?queryText=${encodeURIComponent(name)}` },
  { name: "Postmates", color: "#FFDF00", textColor: "#000", priceHint: "Avg. fees: $4-7", getUrl: (name: string, address: string) => `https://postmates.com/search?q=${encodeURIComponent(name)}` },
  { name: "Seamless", color: "#F05A22", priceHint: "Same as Grubhub", getUrl: (name: string, address: string) => `https://www.seamless.com/search?queryText=${encodeURIComponent(name)}` },
  ]

const RESERVATION_APPS = [
  { name: "OpenTable", color: "#DA3743", getUrl: (name: string, address: string) => `https://www.opentable.com/s?term=${encodeURIComponent(name + " " + address)}&queryUnderstandingType=location` },
  { name: "Resy", color: "#C41E3D", getUrl: (name: string, address: string) => `https://resy.com/cities?query=${encodeURIComponent(name + " " + address.split(",")[0])}` },
  { name: "Yelp", color: "#D32323", getUrl: (name: string, address: string, url: string) => url },
]

const SLOT_ITEMS = ["🍕", "🍔", "🌮", "🍜", "🍣", "🥗", "🍛", "🍝"]

  function Wordmark({ back, onBack }: { back?: boolean; onBack?: () => void }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {back && (
          <button onClick={onBack} aria-label="Go back" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 2 }}>
        Fork
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#FF5C35", marginBottom: 3 }} />
      </div>
    </div>
  )
}

// Slot machine spinner component
function SlotSpinner({ spinning, onComplete }: { spinning: boolean; onComplete?: () => void }) {
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
        // Final reveal with slight delays
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

type Restaurant = {
  id: string
  name: string
  image: string | null
  rating: number
  reviewCount: number
  price: string
  categories: string
  address: string
  url: string
  distance?: number | null
  }

type GroupSession = {
  id: string
  code: string
  location: string
  host_name: string
  status: "waiting" | "voting" | "complete"
  restaurants: Restaurant[]
  final_pick: Restaurant | null
}

type Participant = {
  id: string
  session_id: string
  name: string
  is_host: boolean
}

export default function Home() {
  const supabaseRef = useRef<SupabaseClient | null>(null)
  
  // Initialize Supabase client lazily
  const getSupabase = useCallback(async () => {
    if (!supabaseRef.current) {
      const { createClient } = await import("@/lib/supabase/client")
      supabaseRef.current = createClient()
    }
    return supabaseRef.current
  }, [])
  
  // Core state
  const [screen, setScreen] = useState("location")
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
  
  // Order modal state
  const [showReservations, setShowReservations] = useState(false)
  
  // Lottery / Prize state (passive — no confirmation modal)
  const [lotteryEntryCount, setLotteryEntryCount] = useState(0)
  
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
  
  // Get or create anonymous device ID for lottery
  function getDeviceId(): string {
    if (typeof window === "undefined") return ""
    let id = localStorage.getItem("fork_device_id")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("fork_device_id", id)
    }
    return id
  }

  // Get effective location - MANUAL INPUT ALWAYS TAKES PRIORITY over auto-detected
  // cityIn = what user typed, city = auto-detected or set programmatically
  function getEffectiveLocation(): string {
    // If user typed something, use that (even if we auto-detected)
    const manualInput = cityIn.trim()
    if (manualInput) return manualInput
    // Fall back to auto-detected or default
    return city || "New York"
  }

  // Check if user has swiped before (for hint)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("fork_swiped")) {
      setShowSwipeHint(false)
    }
  }, [])

  // Auto-detect GPS location on mount
  useEffect(() => {
  if (typeof window !== "undefined" && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          setCoords({ lat: latitude, lng: longitude })
          
          // Get readable location name
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
            const data = await res.json()
            const neighborhood = data.address?.suburb || data.address?.neighbourhood || ""
            const c = data.address?.city || data.address?.town || data.address?.village || ""
            const loc = neighborhood ? `${neighborhood}, ${c}` : c
            setCityIn(loc)
          } catch (e) {
            // Fallback - coords are still set
          }
        },
        () => {
          // GPS denied - that's ok, user can type
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  // Fetch active Fork Drop on mount
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
          
          // Check if user already claimed this drop
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
      } catch {
        // No active drop
      }
    }
    fetchActiveDrop()
  }, [])
  
  // Update drop countdown timer
  useEffect(() => {
    if (!activeDrop) return
    
    function updateCountdown() {
      if (!activeDrop) return
      const end = new Date(activeDrop.ends_at).getTime()
      const now = Date.now()
      const diff = end - now
      
      if (diff <= 0) {
        setDropTimeLeft("Ended")
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setDropTimeLeft(`${hours}h ${mins}m left`)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)
    return () => clearInterval(interval)
  }, [activeDrop])

  // Check for group join code in URL on mount
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

  // Submit lottery entry when user completes an order
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
      
      // Get user's entry count for this week
      const now = new Date()
      const weekNum = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
      const { count } = await supabase
        .from("lottery_entries")
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId)
        .eq("week_number", weekNum)
        .eq("year", now.getFullYear())
      
      setLotteryEntryCount(count || 1)
    } catch (e) {
      // Silently fail - don't interrupt the order flow
    }
  }

  // Check if user can spin roulette this month
  async function checkRouletteEligibility() {
    const deviceId = getDeviceId()
    if (!deviceId) return false
    
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
      
      return !data // Can spin if no record found
    } catch {
      return true // Allow spin on error
    }
  }

  // Spin the roulette
  async function spinRoulette() {
    const deviceId = getDeviceId()
    if (!deviceId || rouletteSpinning) return
    
    // Check eligibility first
    const canSpin = await checkRouletteEligibility()
    if (!canSpin) {
      setCanSpinRoulette(false)
      return
    }
    
    setRouletteSpinning(true)
    
    // Get user's location for location-specific prizes
    const userCity = getEffectiveLocation() || "Nationwide"
    
    // Determine result (5% win rate for grand prize, 15% for consolation)
    const roll = Math.random()
    const won = roll < 0.05
    const consolation = !won && roll < 0.20
    
    // Fetch location-appropriate prize from database
    let prize: string | undefined = undefined
    let prizeCity: string | undefined = undefined
    
    try {
      const supabase = await getSupabase()
      
      if (won) {
        // Try to get a grand prize for user's city, fallback to any active grand prize
        const { data: localPrize } = await supabase
          .from("roulette_prizes")
          .select("prize_name, prize_description, city")
          .eq("prize_type", "grand")
          .eq("is_active", true)
          .ilike("city", `%${userCity.split(",")[0].trim()}%`)
          .limit(1)
          .single()
        
        if (localPrize) {
          prize = `${localPrize.prize_name} in ${localPrize.city}`
          prizeCity = localPrize.city
        } else {
          // Fallback to any grand prize
          const { data: anyPrize } = await supabase
            .from("roulette_prizes")
            .select("prize_name, city")
            .eq("prize_type", "grand")
            .eq("is_active", true)
            .limit(1)
            .single()
          
          if (anyPrize) {
            prize = `${anyPrize.prize_name} in ${anyPrize.city}`
            prizeCity = anyPrize.city
          } else {
            prize = "Tasting Menu for Two"
          }
        }
      } else if (consolation) {
        prize = "Free Dessert at Partner Restaurant"
      }
      
      // Record the spin with location
      await supabase.from("roulette_spins").insert({
        device_id: deviceId,
        spin_result: won || consolation ? "win" : "lose",
        prize: prize || null,
        location: userCity,
      })
    } catch {
      // Fallback prizes on error
      prize = won ? "Tasting Menu for Two" : consolation ? "Free Dessert at Partner Restaurant" : undefined
    }
    
    // Animate for 3 seconds then show result
    setTimeout(() => {
      setRouletteSpinning(false)
      setRouletteResult({ won: won || consolation, prize, city: prizeCity })
      setCanSpinRoulette(false)
    }, 3000)
  }

  // Claim the active Fork Drop
  async function claimDrop() {
    if (!activeDrop || dropClaimed) return
    
    const deviceId = getDeviceId()
    if (!deviceId) return
    
    try {
      const supabase = await getSupabase()
      await supabase.from("drop_claims").insert({
        drop_id: activeDrop.id,
        device_id: deviceId,
      })
      setDropClaimed(true)
    } catch {
      // Claim failed
    }
  }

  // Generate shareable group link
  function getShareLink() {
    if (typeof window === "undefined" || !groupSession) return ""
    return `${window.location.origin}?join=${groupSession.code}`
  }

  async function copyShareLink() {
    const link = getShareLink()
    try {
      await navigator.clipboard.writeText(link)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (e) {
      // Fallback for older browsers
      const input = document.createElement("input")
      input.value = link
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

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

      // If "Just drinks" selected, go to drinks flow instead
      if (key === "energy" && value === "drinks") {
        setScreen("drinks-flow")
        return
      }

      if (cardIdx < VIBE_CARDS.length - 1) {
        setCardIdx(i => i + 1)
        setAnimKey(k => k + 1)
      } else {
        setScreen("loading")
        setSlotSpinning(true)
        await fetchRestaurants(newAnswers)
      }
    }, 320)
  }

  // Geocode text location to coordinates
  async function geocodeLocation(text: string): Promise<{ lat: number; lng: number } | null> {
    // If we already have coords and the text matches what we detected, use those
    if (coords && cityIn && text.toLowerCase().includes(cityIn.toLowerCase().split(",")[0])) {
      return coords
    }
    
    try {
      // Add ", NY" or ", New York" if it looks like a NYC neighborhood without state
      let searchText = text
      const nycNeighborhoods = ['astoria', 'brooklyn', 'queens', 'manhattan', 'bronx', 'harlem', 'williamsburg', 'bushwick', 'greenpoint', 'long island city', 'lic', 'flushing', 'jackson heights', 'sunnyside', 'woodside']
      const lowerText = text.toLowerCase()
      if (nycNeighborhoods.some(n => lowerText.includes(n)) && !lowerText.includes('ny') && !lowerText.includes('new york')) {
        searchText = `${text}, New York, NY`
      }
      
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1`)
      const data = await res.json()
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
    } catch (e) {
      // Geocoding failed, will fall back to text search
    }
    return null
  }

  // Handle drinks flow selection
  async function selectDrinksOption(value: string) {
    if (hasSelected.current) return
    hasSelected.current = true
    setSelected(value)
    
    const drinkOption = DRINKS_OPTIONS.find(o => o.value === value)
    const newAnswers = { ...answers, drinks: value }
    setAnswers(newAnswers)

    setTimeout(async () => {
      setSelected(null)
      hasSelected.current = false
      
const loc = getEffectiveLocation()
    setCity(loc) // Ensure city is set for error screen
      setScreen("loading")
      setSlotSpinning(true)

      try {
        const locationCoords = coords || await geocodeLocation(loc)
        
        const res = await fetch("/api/restaurants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: loc,
            neighborhood: loc.split(',')[0].trim().toLowerCase(),
            latitude: locationCoords?.lat,
            longitude: locationCoords?.lng,
            categories: drinkOption?.categories || "bars",
            price: "1,2,3",
            sort_by: "rating",
            limit: 20,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : "Something went wrong")
        setResults(data.restaurants)
        setCurrentResultIdx(0)
        setApproximate(data.approximate || false)
        
        setTimeout(() => {
          setSlotSpinning(false)
          setScreen("single-result")
        }, 1500)
      } catch (e: any) {
        setError(e.message)
        setSlotSpinning(false)
        setScreen("results")
      }
    }, 320)
  }

  async function fetchRestaurants(finalAnswers: Record<string, string>) {
    try {
      // Build categories from vibe answers
      const energyOption = VIBE_CARDS[0].options.find(o => o.value === finalAnswers.energy) as { categories?: string } | undefined
      const appetiteOption = VIBE_CARDS[1].options.find(o => o.value === finalAnswers.appetite) as { categories?: string } | undefined
      
      const categories = energyOption?.categories || appetiteOption?.categories || "restaurants"
      const price = "1,2,3" // All price ranges

const loc = getEffectiveLocation()
  const locationCoords = coords || await geocodeLocation(loc)
  
  const res = await fetch("/api/restaurants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: loc,
      neighborhood: loc.split(',')[0].trim().toLowerCase(),
          latitude: locationCoords?.lat,
          longitude: locationCoords?.lng,
          categories,
          price,
          sort_by: "rating",
          limit: 20,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : "Something went wrong")
      setResults(data.restaurants)
      setCurrentResultIdx(0)
      setApproximate(data.approximate || false)
      
      // Delay to let slot machine finish
      setTimeout(() => {
        setSlotSpinning(false)
        setScreen("single-result")
      }, 1500)
    } catch (e: any) {
      setError(e.message)
      setSlotSpinning(false)
      setScreen("results")
    }
  }

  // Just Go - instant random pick from top results
  async function justGo(c?: string) {
    const loc = c || getEffectiveLocation()
    setCity(loc)
    setScreen("loading")
    setSlotSpinning(true)
    
    try {
      // Geocode if we don't have coords
      const locationCoords = coords || await geocodeLocation(loc)
      
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: loc,
          neighborhood: loc.split(',')[0].trim().toLowerCase(),
          latitude: locationCoords?.lat,
          longitude: locationCoords?.lng,
          categories: "restaurants",
          price: "1,2,3",
          sort_by: "rating",
          limit: 20,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : "Something went wrong")
      
      // Shuffle results for randomness
      const shuffled = shuffleArray(data.restaurants) as typeof data.restaurants
      setResults(shuffled)
      setCurrentResultIdx(0)
      setApproximate(data.approximate || false)
      
      setTimeout(() => {
        setSlotSpinning(false)
        setScreen("single-result")
      }, 1500)
    } catch (e: any) {
      setError(e.message)
      setSlotSpinning(false)
      setScreen("results")
    }
  }

  // Roll again - re-fetch and show new random pick
  async function rollAgain() {
    const loc = getEffectiveLocation()
    setSlotSpinning(true)

    // Rebuild categories from last quiz answers so the re-roll stays on-vibe
    const energyOption = VIBE_CARDS[0].options.find(o => o.value === answers.energy)
    const partyOption = VIBE_CARDS[1].options.find(o => o.value === answers.party)
    const categories = energyOption?.categories || partyOption?.categories || "restaurants"

    try {
      const locationCoords = coords || await geocodeLocation(loc)

      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: loc,
          neighborhood: loc.split(',')[0].trim().toLowerCase(),
          latitude: locationCoords?.lat,
          longitude: locationCoords?.lng,
          categories,
          price: "1,2,3",
          sort_by: "rating",
          limit: 20,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : "Something went wrong")

      // Shuffle results for randomness
      const shuffled = shuffleArray(data.restaurants) as typeof data.restaurants
      setResults(shuffled)
      setCurrentResultIdx(0)
      setApproximate(data.approximate || false)

      setTimeout(() => {
        setSlotSpinning(false)
        setScreen("single-result")
      }, 1500)
    } catch (e: any) {
      setError(e.message)
      setSlotSpinning(false)
      setScreen("results")
    }
  }

  // Swipe handlers for single-card results
  function onSwipeStart(clientX: number) { startX.current = clientX; setDragging(true) }
  function onSwipeMove(clientX: number) { if (dragging) setDragX(clientX - startX.current) }
  function onSwipeEnd() {
    setDragging(false)
    if (dragX > 80) {
      // Swipe right - accept
      handleAccept()
    } else if (dragX < -80) {
      // Swipe left - next
      handleReject()
    }
    setDragX(0)
  }

  function handleAccept() {
    const restaurant = results[currentResultIdx]
    if (restaurant) {
      // Hide swipe hint permanently after first swipe
      if (showSwipeHint) {
        setShowSwipeHint(false)
        localStorage.setItem("fork_swiped", "true")
      }
      setSwipeDir("right")
      setTimeout(() => {
        setSwipeDir(null)
        setOrderModal(restaurant)
      }, 300)
    }
  }

  function handleReject() {
    // Hide swipe hint permanently after first swipe
    if (showSwipeHint) {
      setShowSwipeHint(false)
      localStorage.setItem("fork_swiped", "true")
    }
    setSwipeDir("left")
    setTimeout(() => {
      setSwipeDir(null)
      if (currentResultIdx < results.length - 1) {
        setCurrentResultIdx(i => i + 1)
      } else {
        // No more results
        setScreen("no-more")
      }
    }, 300)
  }

  // ===== GROUP MODE FUNCTIONS =====
  
  function generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  async function createGroupSession() {
    const loc = getEffectiveLocation()
    if (!playerName.trim()) return
    
    const code = generateCode()
    const supabase = await getSupabase()
    
    const { data: session, error: sessionError } = await supabase
      .from("group_sessions")
      .insert({
        code,
        location: loc,
        host_name: playerName,
        status: "waiting",
        restaurants: [],
      })
      .select()
      .single()
    
    if (sessionError || !session) {
      setError("Failed to create group session")
      return
    }

    const { data: participantData, error: participantError } = await supabase
      .from("group_participants")
      .insert({
        session_id: session.id,
        name: playerName,
        is_host: true,
      })
      .select()
      .single()

    if (participantError || !participantData) {
      setError("Failed to join session")
      return
    }

    setGroupSession(session)
    setParticipant(participantData)
    setCity(loc)
    setScreen("group-lobby")
    subscribeToSession(session.id)
  }

  async function joinGroupSession() {
    if (!joinCode.trim() || !playerName.trim()) return

    const supabase = await getSupabase()
    
    const { data: session, error: sessionError } = await supabase
      .from("group_sessions")
      .select("*")
      .eq("code", joinCode.toUpperCase())
      .single()

    if (sessionError || !session) {
      setError("Session not found")
      return
    }

    const { data: participantData, error: participantError } = await supabase
      .from("group_participants")
      .insert({
        session_id: session.id,
        name: playerName,
        is_host: false,
      })
      .select()
      .single()

    if (participantError || !participantData) {
      setError("Failed to join session")
      return
    }

    setGroupSession(session)
    setParticipant(participantData)
    setCity(session.location)
    setScreen(session.status === "voting" ? "group-voting" : "group-lobby")
    subscribeToSession(session.id)
  }

  async function subscribeToSession(sessionId: string) {
    const supabase = await getSupabase()
    
    // Subscribe to session changes
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
        // Refresh participants list
        const sb = await getSupabase()
        const { data } = await sb.from("group_participants").select("*").eq("session_id", sessionId)
        if (data) setParticipants(data)
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_votes", filter: `session_id=eq.${sessionId}` }, async () => {
        // Refresh votes
        const sb = await getSupabase()
        const { data } = await sb.from("group_votes").select("*").eq("session_id", sessionId)
        if (data) {
          const voteMap: Record<string, Record<string, "yes" | "no">> = {}
          data.forEach((v: any) => {
            if (!voteMap[v.restaurant_id]) voteMap[v.restaurant_id] = {}
            voteMap[v.restaurant_id][v.participant_id] = v.vote
          })
          setGroupVotes(voteMap)
          
          // Check for consensus
          checkForConsensus(sessionId, voteMap)
        }
      })
      .subscribe()

    // Initial fetch of participants
    const { data } = await supabase.from("group_participants").select("*").eq("session_id", sessionId)
    if (data) setParticipants(data)
  }

  async function checkForConsensus(sessionId: string, votes: Record<string, Record<string, "yes" | "no">>) {
    if (!groupSession || participants.length === 0) return
    
    const restaurants = groupSession.restaurants || results
    
    for (const restaurant of restaurants) {
      const restaurantVotes = votes[restaurant.id] || {}
      const yesVotes = Object.values(restaurantVotes).filter(v => v === "yes").length
      
      // If everyone voted yes
      if (yesVotes === participants.length) {
        const supabase = await getSupabase()
        await supabase
          .from("group_sessions")
          .update({ status: "complete", final_pick: restaurant })
          .eq("id", sessionId)
        return
      }
    }
  }

  async function startGroupVoting() {
    if (!groupSession || !participant?.is_host) return

    setScreen("loading")
    setSlotSpinning(true)

    try {
      // Use host's GPS coords if available, otherwise geocode the session location
      const locationCoords = coords || await geocodeLocation(groupSession.location)

      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: groupSession.location,
          neighborhood: groupSession.location.split(',')[0].trim().toLowerCase(),
          latitude: locationCoords?.lat,
          longitude: locationCoords?.lng,
          categories: "restaurants",
          price: "1,2,3",
          sort_by: "rating",
          limit: 20,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : "Something went wrong")

      const supabase = await getSupabase()
      await supabase
        .from("group_sessions")
        .update({ status: "voting", restaurants: data.restaurants })
        .eq("id", groupSession.id)

      setResults(data.restaurants)
      setTimeout(() => {
        setSlotSpinning(false)
      }, 1500)
    } catch (e: any) {
      setError(e.message)
      setSlotSpinning(false)
      setScreen("group-lobby")
    }
  }

  async function submitGroupVote(restaurantId: string, vote: "yes" | "no") {
    if (!groupSession || !participant) return
    
    const supabase = await getSupabase()
    await supabase.from("group_votes").upsert({
      session_id: groupSession.id,
      participant_id: participant.id,
      restaurant_id: restaurantId,
      vote,
    }, { onConflict: "session_id,participant_id,restaurant_id" })

    // Move to next restaurant
    if (currentResultIdx < results.length - 1) {
      setCurrentResultIdx(i => i + 1)
    }
  }

  const card = VIBE_CARDS[cardIdx]
  const currentRestaurant = results[currentResultIdx]

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

          {/* ── LOCATION ── */}
          {screen === "location" && (
            <div style={{ ...dark, display: "flex", flexDirection: "column" }}>
              {/* Minimal Wordmark */}
              <div style={{ textAlign: "center", paddingTop: 32, marginBottom: 48 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  Fork
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#FF5C35" }} />
                </div>
              </div>

              {/* Hero */}
              <div style={{ textAlign: "center", marginBottom: 48, flex: 1 }}>
                <h1 className="fork-serif" style={{ fontSize: 44, fontWeight: 400, color: "#fff", lineHeight: 1.05, marginBottom: 16, letterSpacing: "-0.02em" }}>
                  Stop scrolling.
                  <br />
                  <span style={{ color: "#FF5C35" }}>Start eating.</span>
                </h1>
                <p style={{ fontSize: 15, color: "#666", lineHeight: 1.5 }}>
                  We pick one spot. You decide if you&apos;re in.
                </p>
              </div>

              {/* Location Section */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <input 
                    value={cityIn} 
                    onChange={e => setCityIn(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && justGo()}
                    inputMode="search"
                    placeholder="Astoria, Queens"
                    style={{ 
                      flex: 1, 
                      background: "#141414", 
                      border: "1px solid #222", 
                      borderRadius: 14, 
                      padding: "16px 18px", 
                      color: "#fff", 
                      fontSize: 15, 
                      outline: "none",
                      fontFamily: "inherit"
                    }} 
                  />
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(async pos => {
                          const { latitude, longitude } = pos.coords
                          setCoords({ lat: latitude, lng: longitude })
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                          const data = await res.json()
                          const neighborhood = data.address?.suburb || data.address?.neighbourhood || ""
                          const c = data.address?.city || data.address?.town || data.address?.village || ""
                          const loc = neighborhood ? `${neighborhood}, ${c}` : c
                          setCityIn(loc)
                          // Auto-search with detected location
                          justGo(loc)
                        }, undefined, { enableHighAccuracy: true })
                      }
                    }}
                    style={{ 
                      width: 54, 
                      height: 54, 
                      background: "#141414", 
                      border: "1px solid #222", 
                      borderRadius: 14, 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="3" stroke="#FF5C35" strokeWidth="1.5" />
                      <path d="M10 3v2M10 15v2M3 10h2M15 10h2" stroke="#FF5C35" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Primary CTA */}
              <button 
                onClick={() => justGo()}
                style={{ 
                  width: "100%", 
                  background: "#FF5C35", 
                  border: "none", 
                  borderRadius: 14, 
                  padding: "18px 24px", 
                  cursor: "pointer",
                  marginBottom: 12,
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#fff",
                  fontFamily: "inherit"
                }}>
                Pick for me
              </button>

              {/* Secondary Options */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button 
                  onClick={() => startQuiz()}
                  style={{ 
                    flex: 1,
                    background: "#141414", 
                    border: "1px solid #222", 
                    borderRadius: 14, 
                    padding: "14px 16px", 
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#888",
                    fontFamily: "inherit"
                  }}>
                  I have a vibe
                </button>
                <button 
                  onClick={() => setScreen("group-setup")}
                  style={{ 
                    flex: 1,
                    background: "#141414", 
                    border: "1px solid #222", 
                    borderRadius: 14, 
                    padding: "14px 16px", 
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#888",
                    fontFamily: "inherit"
                  }}>
                  With friends
                </button>
              </div>
              
              {/* Fork Drop Banner (when active) */}
              {activeDrop && (
                <button 
                  onClick={() => setScreen("drop")}
                  style={{ 
                    width: "100%",
                    background: "#1D9E75",
                    border: "none", 
                    borderRadius: 14, 
                    padding: "14px 18px", 
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12
                  }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginBottom: 2 }}>FORK DROP</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{activeDrop.restaurant_name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{dropTimeLeft}</div>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* ── FORK ROULETTE ── */}
          {screen === "roulette" && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
              <Wordmark back onBack={() => { setScreen("location"); setRouletteResult(null) }} />
              
              <h1 className="fork-serif" style={{ fontSize: 28, fontWeight: 400, color: "#fff", marginBottom: 8 }}>
                Fork Roulette
              </h1>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 32 }}>
                One spin per month. Make it count.
              </p>
              
              {/* Roulette Wheel */}
              <div style={{ 
                position: "relative", 
                width: 240, 
                height: 240, 
                marginBottom: 32 
              }}>
                {/* Outer ring */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "conic-gradient(#FF5C35 0deg 45deg, #1D9E75 45deg 90deg, #7F77DD 90deg 135deg, #F4A261 135deg 180deg, #FF5C35 180deg 225deg, #1D9E75 225deg 270deg, #7F77DD 270deg 315deg, #F4A261 315deg 360deg)",
                  animation: rouletteSpinning ? "roulette-spin 3s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards" : "none",
                  boxShadow: "0 0 40px rgba(255,92,53,.3)"
                }} />
                {/* Inner circle */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "#141414",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  boxShadow: "0 4px 20px rgba(0,0,0,.5)"
                }}>
                  🍴
                </div>
                {/* Pointer */}
                <div style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "12px solid transparent",
                  borderRight: "12px solid transparent",
                  borderTop: "20px solid #fff",
                  zIndex: 10
                }} />
              </div>
              
              {/* Result or Spin Button */}
              {rouletteResult ? (
                <div className="fade-in" style={{ width: "100%" }}>
                  {rouletteResult.won ? (
                    <>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                      <h2 className="fork-serif" style={{ fontSize: 24, color: "#1D9E75", marginBottom: 8 }}>
                        You won!
                      </h2>
                      <p style={{ fontSize: 16, color: "#fff", fontWeight: 600, marginBottom: 8 }}>
                        {rouletteResult.prize}
                      </p>
                      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
                        {"We'll email you to claim your prize."}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="fork-serif" style={{ fontSize: 22, color: "#888", marginBottom: 8 }}>
                        Not this time
                      </h2>
                      <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>
                        Come back next month for another spin!
                      </p>
                    </>
                  )}
                  <button 
                    onClick={() => { setScreen("location"); setRouletteResult(null) }}
                    style={{ width: "100%", background: "#FF5C35", border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff" }}>
                    Back to Fork
                  </button>
                </div>
              ) : canSpinRoulette ? (
                <button 
                  onClick={spinRoulette}
                  disabled={rouletteSpinning}
                  style={{ 
                    width: "100%", 
                    background: rouletteSpinning ? "#333" : "linear-gradient(135deg, #7F77DD 0%, #FF5C35 100%)", 
                    border: "none", 
                    borderRadius: 14, 
                    padding: "18px", 
                    cursor: rouletteSpinning ? "default" : "pointer", 
                    fontSize: 17, 
                    fontWeight: 600, 
                    color: "#fff",
                    transition: "all .2s"
                  }}>
                  {rouletteSpinning ? "Spinning..." : "Spin the Wheel"}
                </button>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
                    {"You've already spun this month."}
                  </p>
                  <button 
                    onClick={() => setScreen("location")}
                    style={{ width: "100%", background: "#1A1A1A", border: "1px solid #333", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#888" }}>
                    Back to Fork
                  </button>
                </div>
              )}
              
              {/* Prize info */}
              {!rouletteResult && (
                <div style={{ marginTop: 32, padding: "16px", background: "#1A1A1A", borderRadius: 12, width: "100%" }}>
                  <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>This Month{"'"}s Prizes</div>
                  <div style={{ fontSize: 13, color: "#F4A261", marginBottom: 4 }}>Grand: Tasting Menu for Two</div>
                  <div style={{ fontSize: 12, color: "#888" }}>Consolation: Free Dessert</div>
                </div>
              )}
            </div>
          )}

          {/* ── FORK DROP ── */}
          {screen === "drop" && activeDrop && (
            <div style={dark} className="fade-in">
              <Wordmark back onBack={() => setScreen("location")} />
              
              {/* Drop Badge */}
              <div style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: 6, 
                background: "#1D9E75", 
                borderRadius: 8, 
                padding: "6px 12px", 
                marginBottom: 16 
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", textTransform: "uppercase", letterSpacing: 1 }}>Fork Drop</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{dropTimeLeft}</span>
              </div>
              
              <h1 className="fork-serif" style={{ fontSize: 32, fontWeight: 400, color: "#fff", lineHeight: 1.1, marginBottom: 12 }}>
                {activeDrop.restaurant_name}
              </h1>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>
                {activeDrop.city}
              </p>
              <p style={{ fontSize: 15, color: "#ccc", lineHeight: 1.6, marginBottom: 28 }}>
                {activeDrop.description}
              </p>
              
              {/* Editorial Note */}
              <div style={{ background: "#1A1A1A", borderRadius: 12, padding: "16px", marginBottom: 24 }}>
                <div style={{ fontSize: 11, color: "#1D9E75", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{"Fork's Take"}</div>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, fontStyle: "italic" }}>
                  {"Hand-picked by our team. This is one of those spots you tell friends about. Limited to 24 hours because good things don't wait."}
                </p>
              </div>
              
              {/* Claim Button */}
              {dropClaimed ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: "#1D9E75", marginBottom: 16 }}>You claimed this drop</div>
                  <button 
                    onClick={() => setScreen("location")}
                    style={{ width: "100%", background: "#1A1A1A", border: "1px solid #333", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 500, color: "#888" }}>
                    Back to Fork
                  </button>
                </div>
              ) : (
                <button 
                  onClick={claimDrop}
                  style={{ width: "100%", background: "#1D9E75", border: "none", borderRadius: 14, padding: "18px", cursor: "pointer", fontSize: 17, fontWeight: 600, color: "#fff" }}>
                  {"I'm in"}
                </button>
              )}
            </div>
          )}

          {/* ── GROUP SETUP ── */}
          {screen === "group-setup" && (
            <div style={dark} className="fade-in">
              <Wordmark back onBack={() => setScreen("location")} />
              <h1 className="fork-serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
                {"Let's decide together"}
              </h1>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
                Everyone votes, first unanimous pick wins.
              </p>

              <input 
                value={playerName} 
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Your name"
                style={{ width: "100%", background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 16 }} 
              />

              <input 
                value={cityIn} 
                onChange={e => setCityIn(e.target.value)}
                placeholder="Location (e.g. Brooklyn, NY)"
                style={{ width: "100%", background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 20 }} 
              />

              <button 
                onClick={createGroupSession}
                disabled={!playerName.trim()}
                style={{ 
                  width: "100%", 
                  background: playerName.trim() ? "linear-gradient(135deg, #7F77DD 0%, #9B93E8 100%)" : "#333", 
                  border: "none", 
                  borderRadius: 14, 
                  padding: "16px", 
                  cursor: playerName.trim() ? "pointer" : "not-allowed",
                  fontSize: 15, 
                  fontWeight: 600, 
                  color: "#fff",
                  marginBottom: 20
                }}>
                Create a group
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: .5, background: "#1E1E1E" }} />
                <span style={{ fontSize: 12, color: "#444" }}>or join one</span>
                <div style={{ flex: 1, height: .5, background: "#1E1E1E" }} />
              </div>

              <input 
                value={joinCode} 
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter group code"
                maxLength={6}
                style={{ width: "100%", background: "#141414", border: "1px solid #222", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, outline: "none", marginBottom: 16, textAlign: "center", letterSpacing: 4, textTransform: "uppercase" }} 
              />

              <button 
                onClick={joinGroupSession}
                disabled={!joinCode.trim() || !playerName.trim()}
                style={{ 
                  width: "100%", 
                  background: "transparent", 
                  border: "1px solid #7F77DD", 
                  borderRadius: 14, 
                  padding: "14px", 
                  cursor: (joinCode.trim() && playerName.trim()) ? "pointer" : "not-allowed",
                  fontSize: 14, 
                  color: "#7F77DD",
                  opacity: (joinCode.trim() && playerName.trim()) ? 1 : .5
                }}>
                Join group
              </button>

              {error && <p style={{ color: "#D85A30", fontSize: 13, marginTop: 16, textAlign: "center" }}>{error}</p>}
            </div>
          )}

          {/* ── GROUP LOBBY ── */}
          {screen === "group-lobby" && groupSession && (
            <div style={dark} className="fade-in">
              <Wordmark back onBack={() => { setGroupSession(null); setScreen("location") }} />
              <h1 className="fork-serif" style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Waiting for everyone
              </h1>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>{groupSession.location}</p>

              <div style={{ background: "#141414", borderRadius: 16, padding: "20px", marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 12, textAlign: "center" }}>Share this link</div>
                <div style={{ 
                  background: "#0D0D0D", 
                  borderRadius: 10, 
                  padding: "12px 14px", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 10,
                  marginBottom: 12
                }}>
                  <div style={{ 
                    flex: 1, 
                    fontSize: 13, 
                    color: "#888", 
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis" 
                  }}>
                    {getShareLink()}
                  </div>
                  <button 
                    onClick={copyShareLink}
                    style={{ 
                      background: linkCopied ? "#1D9E75" : "#7F77DD", 
                      border: "none", 
                      borderRadius: 8, 
                      padding: "8px 14px", 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: "#fff",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all .15s"
                    }}>
                    {linkCopied ? "Copied!" : "Copy link"}
                  </button>
                </div>
                <div style={{ textAlign: "center", fontSize: 11, color: "#444" }}>
                  or share code: <span style={{ color: "#7F77DD", fontWeight: 600, letterSpacing: 2, fontFamily: "monospace" }}>{groupSession.code}</span>
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                {participants.length} {participants.length === 1 ? "person" : "people"} joined
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {participants.map(p => (
                  <div key={p.id} style={{ background: "#1A1A1A", borderRadius: 20, padding: "8px 14px", fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    {p.name}
                    {p.is_host && <span style={{ fontSize: 10, color: "#7F77DD" }}>HOST</span>}
                  </div>
                ))}
              </div>

              {participant?.is_host ? (
                <button 
                  onClick={startGroupVoting}
                  disabled={participants.length < 2}
                  style={{ 
                    width: "100%", 
                    background: participants.length >= 2 ? "linear-gradient(135deg, #7F77DD 0%, #9B93E8 100%)" : "#333", 
                    border: "none", 
                    borderRadius: 14, 
                    padding: "16px", 
                    cursor: participants.length >= 2 ? "pointer" : "not-allowed",
                    fontSize: 15, 
                    fontWeight: 600, 
                    color: "#fff"
                  }}>
                  {participants.length < 2 ? "Waiting for more people..." : "Start voting"}
                </button>
              ) : (
                <div style={{ textAlign: "center", color: "#666", fontSize: 14 }}>
                  Waiting for host to start...
                </div>
              )}
            </div>
          )}

          {/* ── QUIZ ── */}
          {screen === "quiz" && (
            <div style={{ background: "#0D0D0D", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "28px 24px 16px" }}>
                <Wordmark back onBack={goBack} />
              </div>

              <div key={animKey} className="card-in"
                style={{
                  background: "#141414", borderRadius: "20px 20px 0 0",
                  padding: "32px 24px 44px", flex: 1,
                }}>

                {/* Progress dots */}
                <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "center" }}>
                  {VIBE_CARDS.map((_, i) => (
                    <div key={i} style={{ 
                      width: i === cardIdx ? 24 : 8, 
                      height: 8, 
                      borderRadius: 4, 
                      background: i <= cardIdx ? "#FF5C35" : "#333", 
                      transition: "all .3s" 
                    }} />
                  ))}
                </div>

                <h2 className="fork-serif" style={{ fontSize: 32, fontWeight: 400, color: "#fff", lineHeight: 1.2, marginBottom: 32, textAlign: "center" }}>
                  {card.q}
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {card.options.map(opt => (
                    <button key={opt.value} className="opt"
                      onClick={() => advance(card.key, opt.value)}
                      disabled={!!selected}
                      style={{
                        padding: "18px 20px",
                        border: "none",
                        borderRadius: 14,
                        background: selected === opt.value ? "#FF5C35" : "#1A1A1A",
                        color: selected === opt.value ? "#fff" : "#fff",
                        fontSize: 16, fontWeight: 500, cursor: "pointer",
                        transition: "all .15s", textAlign: "left",
                        fontFamily: "inherit",
                        transform: selected === opt.value ? "scale(0.98)" : "scale(1)",
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DRINKS FLOW ── */}
          {screen === "drinks-flow" && (
            <div style={{ background: "#0D0D0D", minHeight: "100dvh" }}>
              <div style={{ padding: "28px 24px 16px" }}>
                <Wordmark back onBack={() => { setScreen("quiz"); setCardIdx(0) }} />
              </div>

              <div className="card-in" style={{
                background: "#fff", borderRadius: "20px 20px 0 0",
                padding: "28px 24px 44px", minHeight: 520,
              }}>
                <h2 className="fork-serif" style={{ fontSize: 26, fontWeight: 700, color: "#141414", lineHeight: 1.2, marginBottom: 12 }}>
                  What kind of drinks?
                </h2>
                <p style={{ fontSize: 14, color: "#666", marginBottom: 28 }}>
                  {city || "Your area"}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {DRINKS_OPTIONS.map(opt => (
                    <button key={opt.value} className="opt"
                      onClick={() => selectDrinksOption(opt.value)}
                      disabled={!!selected}
                      style={{
                        padding: "20px 16px",
                        border: `1.5px solid ${selected === opt.value ? "#7F77DD" : "#E8E8E8"}`,
                        borderRadius: 14,
                        background: selected === opt.value ? "#7F77DD" : "transparent",
                        color: selected === opt.value ? "#fff" : "#1A1A1A",
                        fontSize: 16, fontWeight: 500, cursor: "pointer",
                        transition: "all .15s", textAlign: "left",
                        fontFamily: "inherit",
                        transform: selected === opt.value ? "scale(0.98)" : "scale(1)",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}>
                      <span style={{ fontSize: 24 }}>
                        {opt.value === "alcohol" && "🍺"}
                        {opt.value === "nonalc" && "🧋"}
                        {opt.value === "both" && "🍹"}
                        {opt.value === "bites" && "🍷"}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── LOADING (Slot Machine) ── */}
          {screen === "loading" && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <SlotSpinner spinning={slotSpinning} />
              <div className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>
                Finding your match
              </div>
              <div style={{ fontSize: 14, color: "#444" }}>
                {"Checking what's open and delivers..."}
              </div>
            </div>
          )}

          {/* ── NO RESULTS FOUND ── */}
          {screen === "single-result" && !currentRestaurant && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
              <div style={{ fontSize: 56, marginBottom: 20 }}>🍽️</div>
              <h2 className="fork-serif" style={{ fontSize: 24, fontWeight: 400, color: "#fff", marginBottom: 12 }}>
                Nothing nearby
              </h2>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 28, maxWidth: 260, lineHeight: 1.5 }}>
                We couldn&apos;t find open spots in your area. Try a different neighborhood or widen your search.
              </p>
              <button 
                onClick={() => setScreen("location")}
                style={{ background: "#FF5C35", border: "none", borderRadius: 14, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
                Try again
              </button>
            </div>
          )}

          {/* ── SINGLE RESULT (Tinder-style) ── */}
          {screen === "single-result" && currentRestaurant && (
            <div style={dark} className="fade-in">
              <Wordmark back onBack={() => setScreen("location")} />
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#888" }}>{currentResultIdx + 1} of {results.length}</span>
              </div>

              {/* Restaurant Card */}
              <div 
                className={swipeDir === "left" ? "swipe-left" : swipeDir === "right" ? "swipe-right" : ""}
                onMouseDown={e => onSwipeStart(e.clientX)}
                onMouseMove={e => { if (dragging) onSwipeMove(e.clientX) }}
                onMouseUp={() => onSwipeEnd()}
                onMouseLeave={() => onSwipeEnd()}
                onTouchStart={e => onSwipeStart(e.touches[0].clientX)}
                onTouchMove={e => onSwipeMove(e.touches[0].clientX)}
                onTouchEnd={() => onSwipeEnd()}
                style={{
                  background: "#141414", 
                  borderRadius: 20, 
                  overflow: "hidden",
                  marginBottom: 24,
                  cursor: "grab",
                  userSelect: "none",
                  transform: dragging ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)` : "none",
                  transition: dragging ? "none" : "transform .3s ease",
                  position: "relative"
                }}>
                
                {/* Swipe indicators */}
                {dragX > 40 && (
                  <div style={{ position: "absolute", top: 20, right: 20, background: "#1D9E75", color: "#fff", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 10 }}>
                    {"LET'S GO!"}
                  </div>
                )}
                {dragX < -40 && (
                  <div style={{ position: "absolute", top: 20, left: 20, background: "#D85A30", color: "#fff", padding: "8px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14, zIndex: 10 }}>
                    NOPE
                  </div>
                )}

                {/* Restaurant Image */}
                {currentRestaurant.image ? (
                  <div style={{ 
                    width: "100%", 
                    height: 200, 
                    background: `url(${currentRestaurant.image}) center/cover`,
                    position: "relative"
                  }}>
                    <div style={{ 
                      position: "absolute", 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      height: 80, 
                      background: "linear-gradient(transparent, #141414)" 
                    }} />
                  </div>
                ) : (
                  <div style={{ 
                    width: "100%", 
                    height: 120, 
                    background: ["#FF5C35","#1D9E75","#7F77DD","#D85A30","#F4A261"][currentResultIdx % 5],
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: 48, 
                    fontWeight: 700, 
                    color: "#fff"
                  }}>
                    {currentRestaurant.name[0]}
                  </div>
                )}

                {/* Card Content */}
                <div style={{ padding: "20px 24px 28px" }}>
                  <h2 className="fork-serif" style={{ fontSize: 26, fontWeight: 400, color: "#fff", marginBottom: 8 }}>
                    {currentRestaurant.name}
                  </h2>
{/* Travel time tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {currentRestaurant.distance != null && currentRestaurant.distance <= 0.4 && (
                      <span style={{ fontSize: 10, color: "#1D9E75", background: "rgba(29,158,117,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                        {Math.max(1, Math.round(currentRestaurant.distance * 20))} min walk
                      </span>
                    )}
                    {currentRestaurant.distance != null && currentRestaurant.distance <= 2.5 && (
                      <span style={{ fontSize: 10, color: "#7F77DD", background: "rgba(127,119,221,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                        {Math.max(2, Math.round(currentRestaurant.distance * 5))} min bike
                      </span>
                    )}
                    {currentRestaurant.distance != null && (
                      <span style={{ fontSize: 10, color: "#F4A261", background: "rgba(244,162,97,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                        {Math.max(2, Math.round(currentRestaurant.distance * 2.5))} min drive
                      </span>
                    )}
                    {currentRestaurant.distance != null && currentRestaurant.distance <= 5 && (
                      <span style={{ fontSize: 10, color: "#888", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: 10 }}>
                        ~{Math.max(5, Math.round(currentRestaurant.distance * 6))} min transit
                      </span>
                    )}
                    {approximate && (
                      <span style={{ fontSize: 10, color: "#E9C46A", background: "rgba(233,196,106,0.15)", padding: "4px 8px", borderRadius: 10 }}>
                        Nearby area
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: "#888", marginBottom: 16 }}>
                    {currentRestaurant.categories} · {currentRestaurant.price}
                  </p>
  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
  <span style={{ fontSize: 14, fontWeight: 600, color: "#F4A261" }}>★ {currentRestaurant.rating}</span>
  <span style={{ fontSize: 13, color: "#888" }}>({currentRestaurant.reviewCount})</span>
  </div>
                  <p style={{ fontSize: 13, color: "#888" }}>
                    {currentRestaurant.address}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                <button 
                  onClick={handleReject}
                  className="action-btn"
                  style={{ 
                    width: 72, 
                    height: 72, 
                    borderRadius: "50%", 
                    background: "#1A1A1A", 
                    border: "2px solid #D85A30",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform .15s"
                  }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="#D85A30" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
                <button 
                  onClick={handleAccept}
                  className="action-btn"
                  style={{ 
                    width: 72, 
                    height: 72, 
                    borderRadius: "50%", 
                    background: "#1D9E75", 
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform .15s"
                  }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {showSwipeHint && (
                <p style={{ fontSize: 12, color: "#444", textAlign: "center", marginTop: 16 }}>
                  Swipe left to skip, swipe right to go
                </p>
              )}
            </div>
          )}

          {/* ── NO MORE RESULTS ���─ */}
          {screen === "no-more" && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
              <div style={{ fontSize: 56, marginBottom: 20 }}>🤷‍♂️</div>
              <h2 className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                {"That's all we found"}
              </h2>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
                Nothing hit? Let&apos;s try again.
              </p>
              <button 
                onClick={() => rollAgain()}
                style={{ background: "#FF5C35", border: "none", borderRadius: 12, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🤷‍♂️</span>
                <span>Roll again</span>
              </button>
              <button 
                onClick={() => setScreen("location")}
                style={{ background: "transparent", border: "1px solid #333", borderRadius: 12, padding: "12px 24px", color: "#666", fontSize: 14, cursor: "pointer" }}>
                Change location
              </button>
            </div>
          )}

          {/* ── GROUP VOTING ── */}
          {screen === "group-voting" && currentRestaurant && groupSession && (
            <div style={dark} className="fade-in">
              <Wordmark />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#7F77DD" }}>Group: {groupSession.code}</span>
                <span style={{ fontSize: 12, color: "#888" }}>{currentResultIdx + 1} of {results.length}</span>
              </div>

              {/* Restaurant Card */}
              <div style={{ background: "#141414", borderRadius: 24, overflow: "hidden", marginBottom: 24 }}>
                {currentRestaurant.image ? (
                  <div style={{
                    width: "100%",
                    height: 180,
                    background: `url(${currentRestaurant.image}) center/cover`,
                    position: "relative"
                  }}>
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      height: 80, background: "linear-gradient(transparent, #141414)"
                    }} />
                  </div>
                ) : (
                  <div style={{
                    width: "100%", height: 120,
                    background: ["#FF5C35","#1D9E75","#7F77DD","#D85A30","#F4A261"][currentResultIdx % 5],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 48, fontWeight: 700, color: "#fff"
                  }}>
                    {currentRestaurant.name[0]}
                  </div>
                )}
                <div style={{ padding: "20px 24px 24px" }}>
                  <h2 className="fork-serif" style={{ fontSize: 20, fontWeight: 400, color: "#fff", textAlign: "center", marginBottom: 6 }}>
                    {currentRestaurant.name}
                  </h2>
                  <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginBottom: 12 }}>
                    {currentRestaurant.categories} · {currentRestaurant.price}
                  </p>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#F4A261" }}>★ {currentRestaurant.rating}</span>
                    {currentRestaurant.distance != null && (
                      <span style={{ fontSize: 12, color: "#666" }}>· {currentRestaurant.distance} mi</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vote status */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>Votes on this pick:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {participants.map(p => {
                    const vote = groupVotes[currentRestaurant.id]?.[p.id]
                    return (
                      <div key={p.id} style={{ 
                        background: vote === "yes" ? "rgba(29,158,117,.2)" : vote === "no" ? "rgba(216,90,48,.2)" : "#1A1A1A", 
                        borderRadius: 12, 
                        padding: "6px 12px", 
                        fontSize: 12, 
                        color: vote === "yes" ? "#1D9E75" : vote === "no" ? "#D85A30" : "#666" 
                      }}>
                        {p.name} {vote === "yes" ? "✓" : vote === "no" ? "✗" : "..."}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Voting buttons */}
              {!groupVotes[currentRestaurant.id]?.[participant?.id || ""] ? (
                <div style={{ display: "flex", gap: 12 }}>
                  <button 
                    onClick={() => submitGroupVote(currentRestaurant.id, "no")}
                    style={{ flex: 1, background: "#1A1A1A", border: "2px solid #D85A30", borderRadius: 14, padding: "16px", cursor: "pointer", color: "#D85A30", fontSize: 15, fontWeight: 600 }}>
                    Nope
                  </button>
                  <button 
                    onClick={() => submitGroupVote(currentRestaurant.id, "yes")}
                    style={{ flex: 1, background: "#1D9E75", border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", color: "#fff", fontSize: 15, fontWeight: 600 }}>
                    {"I'm in!"}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#666", fontSize: 14, padding: "16px" }}>
                  Waiting for others to vote...
                </div>
              )}
            </div>
          )}

          {/* ── GROUP RESULT ── */}
          {screen === "group-result" && groupSession?.final_pick && (
            <div style={dark} className="fade-in">
              <Wordmark />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h1 className="fork-serif" style={{ fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                  {"Everyone agreed!"}
                </h1>
                <p style={{ fontSize: 14, color: "#888", marginBottom: 28 }}>
                  {"You're going to..."}
                </p>

                <div style={{ background: "#fff", borderRadius: 24, padding: "28px", marginBottom: 24 }}>
                  <div style={{ 
                    width: 72, height: 72, borderRadius: 18, 
                    background: "#1D9E75",
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    fontSize: 28, fontWeight: 700, color: "#fff",
                    margin: "0 auto 16px"
                  }}>
                    {groupSession.final_pick.name[0]}
                  </div>
                  <h2 className="fork-serif" style={{ fontSize: 22, fontWeight: 700, color: "#141414", marginBottom: 6 }}>
                    {groupSession.final_pick.name}
                  </h2>
                  <p style={{ fontSize: 14, color: "#888", marginBottom: 12 }}>
                    {groupSession.final_pick.categories} · {groupSession.final_pick.price}
                  </p>
                  <p style={{ fontSize: 13, color: "#666" }}>
                    {groupSession.final_pick.address}
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setOrderModal(groupSession.final_pick)
                  }}
                  style={{ width: "100%", background: "#1D9E75", border: "none", borderRadius: 14, padding: "16px", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 12 }}>
                  Order now
                </button>
                <button 
                  onClick={() => { setGroupSession(null); setScreen("location") }}
                  style={{ width: "100%", background: "transparent", border: "1px solid #333", borderRadius: 12, padding: "14px", cursor: "pointer", color: "#666", fontSize: 13 }}>
                  Start over
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR STATE (was results list — philosophy violation removed) ── */}
          {screen === "results" && (
            <div style={{ ...dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }} className="fade-in">
              <Wordmark back onBack={() => setScreen("location")} />
              <div style={{ fontSize: 56, marginBottom: 20 }}>🍽️</div>
              <h2 className="fork-serif" style={{ fontSize: 24, fontWeight: 400, color: "#fff", marginBottom: 12 }}>
                Nothing matched
              </h2>
              <p style={{ fontSize: 14, color: "#888", marginBottom: 8, maxWidth: 260, lineHeight: 1.5 }}>
                {error || "We couldn't find open spots for that search."}
              </p>
              <p style={{ fontSize: 13, color: "#555", marginBottom: 32, maxWidth: 260, lineHeight: 1.5 }}>
                Try a different neighborhood or go with "Pick for me" to cast a wider net.
              </p>
              <button
                onClick={() => { setError(null); setScreen("location") }}
                style={{ background: "#FF5C35", border: "none", borderRadius: 14, padding: "16px 32px", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Start over
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── DELIVERY APP MODAL ── */}
      {orderModal && (
        <div 
          className="modal-overlay"
          onClick={() => { setOrderModal(null); setShowReservations(false) }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100 }}>
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ background: "#141414", borderRadius: "24px 24px 0 0", padding: "24px 24px 36px", width: "100%", maxWidth: 390, maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 20px" }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FF5C35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                {orderModal.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{orderModal.name}</div>
                <div style={{ fontSize: 13, color: "#666" }}>{orderModal.categories} · {orderModal.price}</div>
              </div>
            </div>

            {/* Toggle between delivery and reservations */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button 
                onClick={() => setShowReservations(false)}
                style={{ 
                  flex: 1, 
                  background: !showReservations ? "#FF5C35" : "#1A1A1A", 
                  border: "none", 
                  borderRadius: 10, 
                  padding: "12px", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: !showReservations ? "#fff" : "#666",
                  cursor: "pointer",
                  transition: "all .15s"
                }}>
                Order Delivery
              </button>
              <button 
                onClick={() => setShowReservations(true)}
                style={{ 
                  flex: 1, 
                  background: showReservations ? "#7F77DD" : "#1A1A1A", 
                  border: "none", 
                  borderRadius: 10, 
                  padding: "12px", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  color: showReservations ? "#fff" : "#666",
                  cursor: "pointer",
                  transition: "all .15s"
                }}>
                Make Reservation
              </button>
            </div>

            {!showReservations ? (
              <>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Choose delivery app:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {DELIVERY_APPS.map(app => (
                    <a 
                      key={app.name}
                      href={app.getUrl(orderModal.name, orderModal.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { 
                        submitLotteryEntry(orderModal)
                        setOrderModal(null)
                        setShowReservations(false) 
                      }}
                      className="delivery-app"
                      style={{ display: "flex", alignItems: "center", gap: 14, background: app.color, borderRadius: 14, padding: "14px 16px", textDecoration: "none", transition: "all .15s" }}>
                      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: (app as any).textColor || "#fff" }}>
                        {app.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: (app as any).textColor || "#fff" }}>{app.name}</span>
                          {(app as any).isCheapest && (
                            <span style={{ fontSize: 10, background: "rgba(255,255,255,.3)", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: (app as any).textColor || "#fff" }}>BEST VALUE</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2 }}>{(app as any).priceHint}</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 12L12 4M12 4H6M12 4V10" stroke={(app as any).textColor || "#fff"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Book a table:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {RESERVATION_APPS.map(app => (
                    <a 
                      key={app.name}
                      href={app.getUrl(orderModal.name, orderModal.address, orderModal.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { 
                        submitLotteryEntry(orderModal)
                        setOrderModal(null)
                        setShowReservations(false) 
                      }}
                      className="delivery-app"
                      style={{ display: "flex", alignItems: "center", gap: 14, background: app.color, borderRadius: 14, padding: "14px 16px", textDecoration: "none", transition: "all .15s" }}>
                      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>
                        {app.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{app.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>
                          {app.name === "Yelp" ? "View restaurant page" : `Find ${orderModal.name}`}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 12L12 4M12 4H6M12 4V10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  ))}
                </div>
              </>
            )}

            <button 
              onClick={() => { setOrderModal(null); setShowReservations(false) }}
              style={{ width: "100%", background: "transparent", border: "1px solid #333", borderRadius: 12, padding: "14px", marginTop: 16, color: "#666", fontSize: 14, fontFamily: "inherit", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </>
  )
}
