export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("fork_device_id")
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem("fork_device_id", id)
  }
  return id
}

export function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const NYC_NEIGHBORHOODS = [
  "astoria", "brooklyn", "queens", "manhattan", "bronx", "harlem",
  "williamsburg", "bushwick", "greenpoint", "long island city", "lic",
  "flushing", "jackson heights", "sunnyside", "woodside",
]

export async function geocodeLocation(
  text: string,
  existingCoords?: { lat: number; lng: number } | null,
  detectedInput?: string,
): Promise<{ lat: number; lng: number } | null> {
  if (existingCoords && detectedInput && text.toLowerCase().includes(detectedInput.toLowerCase().split(",")[0])) {
    return existingCoords
  }

  try {
    let searchText = text
    const lowerText = text.toLowerCase()
    if (NYC_NEIGHBORHOODS.some(n => lowerText.includes(n)) && !lowerText.includes("ny") && !lowerText.includes("new york")) {
      searchText = `${text}, New York, NY`
    }

    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1`)
    const data = await res.json()
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch {
    // Geocoding failed, will fall back to text search
  }
  return null
}
