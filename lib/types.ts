export type Restaurant = {
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
  phone?: string | null
  isClosed?: boolean
  transactions?: string[]  // "delivery", "pickup", "restaurant_reservation"
}

export type GroupSession = {
  id: string
  code: string
  location: string
  host_name: string
  status: "waiting" | "voting" | "complete"
  restaurants: Restaurant[]
  final_pick: Restaurant | null
}

export type Participant = {
  id: string
  session_id: string
  name: string
  is_host: boolean
}

export type Screen =
  | "location"
  | "quiz"
  | "drinks-flow"
  | "loading"
  | "single-result"
  | "no-more"
  | "results"
  | "group-setup"
  | "group-lobby"
  | "group-voting"
  | "group-result"
  | "roulette"
  | "drop"
  | "group-join"
  | "favorites"
