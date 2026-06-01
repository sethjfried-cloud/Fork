export const VIBE_CARDS = [
  {
    q: "What vibe?",
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
    q: "Solo or group?",
    key: "party",
    options: [
      { label: "Just me", value: "solo", categories: "cafes,ramen,sushi,sandwiches" },
      { label: "With others", value: "group", categories: "korean,mexican,italian,tapas,pizza" },
    ],
  },
]

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
