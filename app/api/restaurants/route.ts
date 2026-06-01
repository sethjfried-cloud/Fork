import { NextRequest, NextResponse } from 'next/server'

// NYC neighborhoods for STRICT filtering - only exact matches, no borough fallback
// This prevents Astoria searches from returning LIC or Manhattan results
const NYC_NEIGHBORHOODS: Record<string, { terms: string[]; excludes: string[] }> = {
  'astoria': { terms: ['astoria'], excludes: ['long island city', 'lic', 'manhattan', 'woodside', 'jackson heights'] },
  'williamsburg': { terms: ['williamsburg'], excludes: ['greenpoint', 'bushwick', 'manhattan'] },
  'bushwick': { terms: ['bushwick'], excludes: ['williamsburg', 'ridgewood'] },
  'greenpoint': { terms: ['greenpoint'], excludes: ['williamsburg', 'long island city'] },
  'long island city': { terms: ['long island city', 'lic'], excludes: ['astoria', 'sunnyside', 'manhattan'] },
  'lic': { terms: ['long island city', 'lic'], excludes: ['astoria', 'sunnyside', 'manhattan'] },
  'flushing': { terms: ['flushing'], excludes: ['corona', 'whitestone'] },
  'jackson heights': { terms: ['jackson heights'], excludes: ['elmhurst', 'corona', 'astoria'] },
  'sunnyside': { terms: ['sunnyside'], excludes: ['woodside', 'long island city'] },
  'woodside': { terms: ['woodside'], excludes: ['sunnyside', 'jackson heights'] },
  'brooklyn': { terms: ['brooklyn'], excludes: [] },
  'manhattan': { terms: ['manhattan', 'new york'], excludes: [] },
  'harlem': { terms: ['harlem'], excludes: ['washington heights', 'inwood'] },
  'queens': { terms: ['queens'], excludes: [] },
  'bronx': { terms: ['bronx'], excludes: [] },
  'upper east side': { terms: ['upper east side', 'ues'], excludes: ['harlem', 'yorkville'] },
  'upper west side': { terms: ['upper west side', 'uws'], excludes: ['harlem', 'morningside'] },
  'lower east side': { terms: ['lower east side', 'les'], excludes: ['chinatown', 'east village'] },
  'east village': { terms: ['east village'], excludes: ['lower east side', 'gramercy'] },
  'west village': { terms: ['west village', 'greenwich village'], excludes: ['soho', 'tribeca'] },
  'soho': { terms: ['soho'], excludes: ['tribeca', 'noho', 'little italy'] },
  'tribeca': { terms: ['tribeca'], excludes: ['soho', 'financial district'] },
  'chelsea': { terms: ['chelsea'], excludes: ['hells kitchen', 'flatiron'] },
}

// Yelp category aliases that are NOT restaurants — blocklist applied post-fetch.
// These slip through because Yelp's `restaurants` umbrella is loose.
const BLOCKED_CATEGORY_ALIASES = new Set([
  // Grocery / retail food
  'grocery', 'supermarkets', 'convenience', 'gaspstations', 'servicestations',
  'pharmacy', 'drugstores', 'vitaminsupplements', 'healthmarkets',
  // Shopping / non-food
  'shopping', 'deptstores', 'wholesale', 'costco',
  // Services
  'financialservices', 'banks', 'laundryservices', 'drycleaninglaundry',
  'autorepair', 'bodyshops', 'CarWash',
  // Hospitality but not dining
  'hotels', 'hotelstravel',
])

// Time-aware category suggestions based on hour of day (UTC offset handled client-side).
// Client sends optional `hour` param; if present, we blend time-appropriate categories.
function getTimeCategories(hour: number | undefined, baseCategories: string): string {
  if (hour == null) return baseCategories
  // Early morning (5-10): breakfast/brunch/coffee
  if (hour >= 5 && hour < 10) return baseCategories === 'restaurants' ? 'breakfast_brunch,cafes,coffee' : baseCategories
  // Brunch window (10-13): brunch-heavy
  if (hour >= 10 && hour < 13) return baseCategories === 'restaurants' ? 'breakfast_brunch,restaurants' : baseCategories
  // Lunch (13-16): default restaurants is fine
  if (hour >= 13 && hour < 16) return baseCategories
  // Happy hour (16-18): bars + restaurants
  if (hour >= 16 && hour < 18) return baseCategories === 'restaurants' ? 'restaurants,bars' : baseCategories
  // Dinner (18-22): default restaurants is fine
  if (hour >= 18 && hour < 22) return baseCategories
  // Late night (22-5): bars, late night food
  return baseCategories === 'restaurants' ? 'bars,restaurants' : baseCategories
}

const MAX_LIMIT = 20
// Minimum reviews to appear — filters out closed/inactive listings and non-restaurants
// that happen to be on Yelp (ShopRite, bodegas, etc.)
const MIN_REVIEW_COUNT = 5

// In-memory response cache — prevents duplicate Yelp calls for the same query.
// Keyed by location+categories, entries expire after 60 seconds.
// This is per-serverless-instance so it won't prevent ALL duplicates,
// but catches the common case of rapid re-fetches from the same user.
const responseCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL_MS = 60_000

function getCacheKey(location: string, latitude: number | undefined, longitude: number | undefined, categories: string): string {
  if (latitude && longitude) return `${latitude.toFixed(4)},${longitude.toFixed(4)}|${categories}`
  return `${(location || '').toLowerCase().trim()}|${categories}`
}

export async function POST(req: NextRequest) {
  const { location, latitude, longitude, categories, price, sort_by, neighborhood, limit: requestedLimit, hour, dietary } = await req.json()

  // Input sanitization
  if (location && typeof location === 'string' && location.length > 200) {
    return NextResponse.json({ error: 'Location input too long' }, { status: 400 })
  }

  // Need either coordinates or text location
  if (!location && !latitude) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 })
  }

  const apiKey = process.env.YELP_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API configuration error' }, { status: 500 })
  }

  // Time-aware category adjustment
  const timeAwareCategories = getTimeCategories(typeof hour === 'number' ? hour : undefined, categories || 'restaurants')

  // Dietary filter terms — appended to categories so Yelp filters results.
  // If dietary filters are active, they replace the base categories since
  // Yelp's category search is OR-based and dietary terms are more specific.
  const dietaryTerms: string[] = Array.isArray(dietary) ? dietary : []
  const finalCategories = dietaryTerms.length > 0
    ? dietaryTerms.join(',')
    : timeAwareCategories

  // Check response cache before hitting Yelp
  const cacheKey = getCacheKey(location, latitude, longitude, finalCategories)
  const cached = responseCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data)
  }

  // Cap limit at MAX_LIMIT - handle both string and number input
  const parsedLimit = typeof requestedLimit === 'number' ? requestedLimit : parseInt(requestedLimit) || 5
  const limit = String(Math.min(Math.max(parsedLimit, 1), MAX_LIMIT))

  // Build params - prefer lat/long for accuracy, fallback to text location
  // 1200 meters = ~0.75 miles - tighter neighborhood radius to avoid adjacent areas
  const params = new URLSearchParams({
    categories: finalCategories,
    price: price || '1,2',
    sort_by: sort_by || 'distance',
    open_now: 'true',
    limit: '50', // Fetch more to filter down
    radius: '1200',
  })

  // Use coordinates if available (much more accurate)
  if (latitude && longitude) {
    params.set('latitude', String(latitude))
    params.set('longitude', String(longitude))
  } else {
    params.set('location', location)
  }

  const url = `https://api.yelp.com/v3/businesses/search?${params}&transactions=delivery`

  // Fetch with 8 second timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
  } catch (e: any) {
    clearTimeout(timeoutId)
    if (e.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 502 })
  }
  clearTimeout(timeoutId)

  if (!res.ok) {
    try {
      const errData = await res.json()
      return NextResponse.json({ error: errData.error?.description || 'Yelp API error' }, { status: 502 })
    } catch {
      return NextResponse.json({ error: 'Yelp API error' }, { status: 502 })
    }
  }

  const data = await res.json()

  if (!data.businesses) {
    return NextResponse.json({ restaurants: [], approximate: false })
  }

  // Get neighborhood filter config
  const searchNeighborhood = (neighborhood || location || '').toLowerCase().trim()
  const neighborhoodConfig = NYC_NEIGHBORHOODS[searchNeighborhood]
  const filterTerms = neighborhoodConfig?.terms || [searchNeighborhood.split(',')[0].trim()]
  const excludeTerms = neighborhoodConfig?.excludes || []

  // Map and quality-filter in one pass
  const allRestaurants = (data.businesses ?? [])
    .filter((b: any) => {
      // Must have minimum reviews — weeds out ghost listings and non-restaurants
      if ((b.review_count ?? 0) < MIN_REVIEW_COUNT) return false

      // Reject if ANY of the business's categories are on the blocklist
      const categoryAliases: string[] = (b.categories ?? []).map((c: any) => c.alias as string)
      if (categoryAliases.some(alias => BLOCKED_CATEGORY_ALIASES.has(alias))) return false

      return true
    })
    .map((b: any) => ({
      id: b.id,
      name: b.name,
      image: b.image_url ?? null,
      rating: b.rating,
      reviewCount: b.review_count,
      price: b.price ?? '$',
      categories: b.categories.map((c: any) => c.title).join(', '),
      address: b.location.display_address.join(', '),
      city: b.location.city?.toLowerCase() || '',
      neighborhood: (b.location.neighborhood || b.location.address2 || '').toLowerCase(),
      url: b.url,
      // Distance in miles (Yelp returns meters)
      distance: b.distance ? Math.round(b.distance * 0.000621371 * 10) / 10 : null,
      phone: b.display_phone || null,
      isClosed: b.is_closed ?? false,
      transactions: b.transactions ?? [],
    }))

  // STRICT filtering: must match neighborhood AND must NOT be in excluded areas
  const filteredRestaurants = allRestaurants.filter((r: any) => {
    const addressLower = r.address.toLowerCase()
    const neighborhoodLower = r.neighborhood.toLowerCase()
    const fullLocation = `${addressLower} ${neighborhoodLower}`

    // Check if in an excluded area first
    const isExcluded = excludeTerms.some((term: string) => fullLocation.includes(term))
    if (isExcluded) return false

    // Must match at least one filter term in address or Yelp's neighborhood field
    const matchesTerm = filterTerms.some((term: string) =>
      addressLower.includes(term) || neighborhoodLower.includes(term)
    )

    return matchesTerm
  })

  // Sort filtered results by distance (closest first), then by rating
  const sortedFiltered = filteredRestaurants.sort((a: any, b: any) => {
    const distA = a.distance ?? 999
    const distB = b.distance ?? 999
    if (Math.abs(distA - distB) < 0.1) {
      return b.rating - a.rating // Same distance, sort by rating
    }
    return distA - distB
  })

  // If filtering leaves us with too few results, fall back to distance-sorted unfiltered
  const useFiltered = sortedFiltered.length >= 3
  const restaurants = useFiltered
    ? sortedFiltered.slice(0, parseInt(limit))
    : allRestaurants.slice(0, parseInt(limit))

  const responseData = { restaurants, approximate: !useFiltered }

  // Cache the response and evict stale entries
  responseCache.set(cacheKey, { data: responseData, timestamp: Date.now() })
  if (responseCache.size > 100) {
    const now = Date.now()
    for (const [key, entry] of responseCache) {
      if (now - entry.timestamp > CACHE_TTL_MS) responseCache.delete(key)
    }
  }

  return NextResponse.json(responseData)
}
