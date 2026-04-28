Location Agent — Development Requirements

1. Purpose

Location Agent отвечает за поиск туристических мест (POI) по запросу пользователя.

Он НЕ строит маршрут и НЕ принимает финальные travel-решения.

Его задача:

normalized user intent → location + categories → POI results

⸻

2. Responsibilities

Location Agent должен:

* принимать нормализованный intent от Intent Extractor
* определять географическую область поиска
* находить подходящие POI категории
* вызывать external POI providers
* нормализовать результаты
* возвращать чистый JSON для Itinerary Agent
* логировать все вызовы и ошибки

Location Agent НЕ должен:

* генерировать itinerary
* выбирать финальный маршрут по дням
* выдумывать места
* выдумывать rating/reviews/price level
* обращаться к LLM без необходимости

⸻

3. Input Contract

type LocationAgentInput = {
  destination: string
  area?: string
  days: number
  month?: string
  budget: 'low' | 'mid' | 'high'
  preferences: PlacePreference[]
  style?: TravelStyle[]
  constraints?: TravelConstraint[]
  lang?: 'en' | 'ru'
  limitPerCategory?: number
}

PlacePreference

type PlacePreference =
  | 'beaches'
  | 'cafes'
  | 'restaurants'
  | 'attractions'
  | 'nightlife'
  | 'shopping'
  | 'supermarkets'
  | 'viewpoints'
  | 'parks'
  | 'temples'

TravelStyle

type TravelStyle =
  | 'chill'
  | 'active'
  | 'family'
  | 'romantic'
  | 'nightlife'

TravelConstraint

type TravelConstraint =
  | 'indoor_if_rain'
  | 'cheap_only'
  | 'avoid_nightlife'
  | 'outdoor_preferred'

⸻

4. Output Contract

type LocationAgentOutput = {
  destination: ResolvedLocation
  searchArea: SearchArea
  categories: ResolvedCategory[]
  places: NormalizedPlace[]
  warnings: string[]
  providerMeta: ProviderMeta[]
}

ResolvedLocation

type ResolvedLocation = {
  name: string
  formatted: string
  lat: number
  lon: number
  placeId?: string
  bbox?: {
    lon1: number
    lat1: number
    lon2: number
    lat2: number
  }
}

SearchArea

type SearchArea = {
  type: 'place' | 'circle' | 'rect'
  value: string
  radiusMeters?: number
}

ResolvedCategory

type ResolvedCategory = {
  preference: PlacePreference
  provider: 'geoapify' | 'google_places'
  providerCategory: string
  confidence?: number
}

NormalizedPlace

type NormalizedPlace = {
  id: string
  provider: 'geoapify' | 'google_places'
  name: string
  category: string
  categories: string[]
  lat: number
  lon: number
  address?: string
  district?: string
  city?: string
  openingHours?: string
  website?: string
  phone?: string
  cuisine?: string
  facilities?: {
    internetAccess?: boolean
    outdoorSeating?: boolean
  }
  rating?: number
  userRatingCount?: number
  priceLevel?: number
  googleMapsUri?: string
  sourceAttribution?: string
}

⸻

5. Supported POI Categories

MVP работает с ограниченным набором внутренних категорий.

Internal Category	Geoapify Mapping	Google Places Mapping	Usage
beaches	beach	tourist_attraction / natural_feature fallback	Daytime outdoor activity
cafes	catering.cafe	cafe	Morning / chill activity
restaurants	catering.restaurant	restaurant	Lunch / dinner
attractions	tourism.attraction	tourist_attraction	Sightseeing
nightlife	catering.bar, entertainment.nightclub	bar, night_club	Evening
shopping	commercial.shopping_mall	shopping_mall	Indoor / rain fallback
supermarkets	commercial.supermarket	supermarket	Practical needs
viewpoints	natural.viewpoint	tourist_attraction	Sunset / scenic places
parks	leisure.park	park	Outdoor relaxed activity
temples	religion.place_of_worship	place_of_worship	Culture

⸻

6. Category Resolution Strategy

MVP strategy

Use static mapping from internal category to provider category.

const GEOAPIFY_CATEGORY_MAP = {
  beaches: ['beach'],
  cafes: ['catering.cafe'],
  restaurants: ['catering.restaurant'],
  attractions: ['tourism.attraction'],
  nightlife: ['catering.bar', 'entertainment.nightclub'],
  shopping: ['commercial.shopping_mall'],
  supermarkets: ['commercial.supermarket'],
  viewpoints: ['natural.viewpoint'],
  parks: ['leisure.park'],
  temples: ['religion.place_of_worship'],
}

Advanced strategy

Later, all provider categories can be stored in Qdrant.

Flow:

place query → embedding → Qdrant category search → top categories → provider API

For MVP, Qdrant category search is optional.

⸻

7. Location Resolution Strategy

Step 1 — Geocode destination

Example:

Phuket → lat/lon/place_id/bbox

Use Geoapify Geocoding API.

Step 2 — Resolve search filter

Priority:

1. If area exists → geocode area + destination → circle filter
2. Else if destination has valid placeId → place filter
3. Else → circle filter around destination center

Examples

Destination-level search

filter=place:{placeId}

Area-level search

filter=circle:{lon},{lat},5000

Fallback search

filter=circle:{lon},{lat},30000

⸻

8. Provider Strategy

Geoapify

Primary provider for MVP.

Used for:

* geocoding
* base POI search
* free/low-cost location data

Google Places

Optional enrichment provider.

Used for:

* rating
* userRatingCount
* priceLevel
* Google Maps link
* better opening hours

Recommended flow:

Geoapify returns POI list
↓
Select top N places
↓
Google Places enriches selected places

Do not use Google Places for every place by default.

⸻

9. Search Algorithm

1. Receive LocationAgentInput
2. Validate input
3. Geocode destination
4. If area exists, geocode area
5. Build spatial filter
6. Resolve internal preferences to provider categories
7. Fetch POI for each category
8. Normalize provider responses
9. Deduplicate places
10. Apply basic ranking
11. Return LocationAgentOutput

⸻

10. Deduplication Rules

Places can duplicate across categories/providers.

Deduplicate by:

1. provider id / place_id
2. same normalized name + close coordinates
3. distance between coordinates less than 50 meters

Normalized name rule:

lowercase → trim → remove extra spaces → remove punctuation

⸻

11. Basic Ranking Rules

Ranking should be simple and explainable.

Prefer places with:

* name exists
* opening hours exists
* website exists
* rating exists
* higher rating
* higher userRatingCount
* closer to requested area
* matching category

Do not invent popularity.

⸻

12. Caching Requirements

Cache external API responses to reduce cost.

Recommended cache keys:

geocode:{query}:{lang}
places:{provider}:{category}:{filter}:{limit}:{lang}

Recommended TTL:

Data	TTL
Geocoding	7–30 days
POI search	1–7 days
Google enrichment	7 days

Cache can be implemented in PostgreSQL for MVP.

⸻

13. Error Handling

Location Agent should handle:

* empty geocoding result
* invalid destination
* provider timeout
* provider rate limit
* empty POI result
* malformed provider response

Fallbacks

Error	Fallback
place filter fails	use circle filter
category returns empty	try broader parent category
provider timeout	return partial results
Google enrichment fails	keep Geoapify-only data

⸻

14. Observability

Every external call should be logged.

Fields:

type ProviderCallLog = {
  requestId: string
  provider: 'geoapify' | 'google_places'
  operation: 'geocode' | 'places_search' | 'details_enrichment'
  input: object
  status: 'success' | 'error'
  latencyMs: number
  resultCount?: number
  error?: string
  createdAt: string
}

Store logs in agent_runs or separate provider_call_logs table.

⸻

15. Security Requirements

* never expose API keys to frontend
* validate all user inputs
* limit max days to 7
* limit max categories per request
* limit max results per category
* rate limit API endpoint
* sanitize provider responses before passing to LLM

⸻

16. Performance Requirements

Target for MVP:

Metric	Target
Geocoding latency	< 1s
POI search latency	< 3s
Full Location Agent response	< 5s
Max categories per request	5
Max POI per category	10–20

Provider calls by category should be executed in parallel with concurrency limit.

⸻

17. Example Input

{
  "destination": "Phuket",
  "area": "Bang Tao",
  "days": 3,
  "month": "May",
  "budget": "mid",
  "preferences": ["cafes", "beaches", "restaurants"],
  "style": ["chill"],
  "constraints": [],
  "lang": "en",
  "limitPerCategory": 10
}

⸻

18. Example Output

{
  "destination": {
    "name": "Phuket",
    "formatted": "Phuket, Thailand",
    "lat": 7.8804,
    "lon": 98.3923,
    "placeId": "..."
  },
  "searchArea": {
    "type": "circle",
    "value": "circle:98.295,7.985,5000",
    "radiusMeters": 5000
  },
  "categories": [
    {
      "preference": "cafes",
      "provider": "geoapify",
      "providerCategory": "catering.cafe"
    }
  ],
  "places": [
    {
      "id": "geoapify:51c39ca04d8e98584059...",
      "provider": "geoapify",
      "name": "Eat me bakery and cafe",
      "category": "cafes",
      "categories": ["catering", "catering.cafe"],
      "lat": 7.8886957,
      "lon": 98.3836855,
      "address": "122, Mae Luan Road, Phuket City Municipality, Thailand",
      "openingHours": "24/7",
      "website": "https://www.facebook.com/eatme.bakerycafe",
      "cuisine": "coffee_shop",
      "facilities": {
        "internetAccess": true,
        "outdoorSeating": true
      },
      "sourceAttribution": "© OpenStreetMap contributors"
    }
  ],
  "warnings": [],
  "providerMeta": [
    {
      "provider": "geoapify",
      "operation": "places_search",
      "status": "success",
      "resultCount": 10,
      "latencyMs": 840
    }
  ]
}

⸻

19. Acceptance Criteria

Location Agent is ready when:

* it accepts normalized intent
* it geocodes destination
* it supports area-based search
* it searches at least 5 POI categories
* it returns normalized POI data
* it handles empty provider results
* it logs provider calls
* it does not expose API keys
* it can return partial results if one category fails

⸻

20. MVP Implementation Order

1. Implement Geoapify geocoding
2. Implement Geoapify places search
3. Add internal category mapping
4. Add response normalization
5. Add deduplication
6. Add basic ranking
7. Add logging
8. Add caching
9. Add optional Google Places enrichment