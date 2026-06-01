export const VIBE_CARDS = [
  {
    q: "What's the mood?",
    key: "energy",
    options: [
      { label: "Loud & lively", value: "lively", categories: "bars,gastropubs,korean,mexican" },
      { label: "Chill", value: "quiet", categories: "cafes,italian,japanese,mediterranean" },
      { label: "Quick bite", value: "quick", categories: "fastfood,sandwiches,pizza,burgers" },
      { label: "Fancy", value: "upscale", categories: "steak,seafood,french,finedining" },
      { label: "Just drinks", value: "drinks", categories: "bars" },
    ],
  },
  {
    q: "Who's coming?",
    key: "party",
    options: [
      { label: "Just me", value: "solo", categories: "cafes,ramen,sushi,sandwiches" },
      { label: "With others", value: "group", categories: "korean,mexican,italian,tapas,pizza" },
    ],
  },
]

// One-tap mood presets — richer than the quiz, faster than building filters.
// Each mood maps to Yelp categories + optional price filter.
export const MOOD_PRESETS = [
  { label: "Date night", value: "date", icon: "🕯️", categories: "italian,french,japanese,tapas,wine_bars,cocktailbars", price: "2,3,4" },
  { label: "Hangover cure", value: "hangover", icon: "🥴", categories: "diners,breakfast_brunch,burgers,ramen,pizza,sandwiches", price: "1,2" },
  { label: "Impressing someone", value: "impress", icon: "✨", categories: "steak,seafood,french,finedining,japanese,newamerican", price: "3,4" },
  { label: "Cheap & fast", value: "cheap", icon: "⚡", categories: "fastfood,pizza,sandwiches,chinese,mexican,falafel", price: "1,2" },
  { label: "Outdoor vibes", value: "outdoor", icon: "☀️", categories: "cafes,mediterranean,mexican,gastropubs,seafood,newamerican", price: "1,2,3" },
  { label: "Comfort food", value: "comfort", icon: "🛋️", categories: "burgers,pizza,bbq,southern,soulfood,diners,mac_and_cheese", price: "1,2,3" },
  { label: "Something new", value: "adventurous", icon: "🌍", categories: "ethiopian,thai,indian,korean,vietnamese,turkish,peruvian", price: "1,2,3" },
  { label: "Healthy-ish", value: "healthy", icon: "🥗", categories: "salad,acaibowls,juicebars,poke,mediterranean,vegan", price: "1,2,3" },
] as const

// Dietary filters — toggleable, persisted in localStorage.
// Each maps to a Yelp category modifier or attribute.
export const DIETARY_FILTERS = [
  { label: "Vegetarian", value: "vegetarian", yelpTerm: "vegetarian" },
  { label: "Vegan", value: "vegan", yelpTerm: "vegan" },
  { label: "Gluten-free", value: "gluten_free", yelpTerm: "gluten_free" },
  { label: "Halal", value: "halal", yelpTerm: "halal" },
  { label: "Kosher", value: "kosher", yelpTerm: "kosher" },
] as const

export const DRINKS_OPTIONS = [
  { label: "Alcohol", value: "alcohol", emoji: "🍺", categories: "bars,wine_bars,cocktailbars,pubs,breweries,beer_bar" },
  { label: "Non-alcoholic", value: "nonalc", emoji: "🧋", categories: "coffee,bubbletea,juicebars,tea" },
  { label: "Both", value: "both", emoji: "🍹", categories: "bars,cocktailbars,coffee,cafes" },
  { label: "Drinks + small bites", value: "bites", emoji: "🍷", categories: "gastropubs,tapas,wine_bars,izakaya" },
]

export const DELIVERY_APPS = [
  { name: "Uber Eats", color: "#06C167", priceHint: "Avg. fees: $3-5", getUrl: (name: string, address: string) => `https://www.ubereats.com/search?q=${encodeURIComponent(name + " " + address)}` },
  { name: "DoorDash", color: "#FF3008", priceHint: "Often cheapest", isCheapest: true, getUrl: (name: string, address: string) => `https://www.doordash.com/search/store/${encodeURIComponent(name)}/` },
  { name: "Grubhub", color: "#F63440", priceHint: "Free delivery deals", getUrl: (name: string, address: string) => `https://www.grubhub.com/search?queryText=${encodeURIComponent(name)}` },
  { name: "Postmates", color: "#FFDF00", textColor: "#000", priceHint: "Avg. fees: $4-7", getUrl: (name: string, address: string) => `https://postmates.com/search?q=${encodeURIComponent(name)}` },
  { name: "Seamless", color: "#F05A22", priceHint: "Same as Grubhub", getUrl: (name: string, address: string) => `https://www.seamless.com/search?queryText=${encodeURIComponent(name)}` },
]

export const RESERVATION_APPS = [
  {
    name: "OpenTable",
    color: "#DA3743",
    hint: "Search if they're listed",
    getUrl: (name: string, address: string) => `https://www.opentable.com/s?term=${encodeURIComponent(name + " " + address)}&queryUnderstandingType=location`,
  },
  {
    name: "Resy",
    color: "#C41E3D",
    hint: "Search if they're listed",
    getUrl: (name: string, address: string) => `https://resy.com/cities?query=${encodeURIComponent(name + " " + address.split(",")[0])}`,
  },
  {
    name: "Yelp",
    color: "#D32323",
    hint: "View restaurant page & contact",
    getUrl: (_name: string, _address: string, url: string) => url,
  },
]

export const SLOT_ITEMS = ["🍕", "🍔", "🌮", "🍜", "🍣", "🥗", "🍛", "🍝"]

export const CARD_COLORS = ["#FF5C35", "#1D9E75", "#7F77DD", "#D85A30", "#F4A261"]
