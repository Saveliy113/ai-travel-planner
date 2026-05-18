# Architecture Blueprint: AI Travel Planner

> Complete system design, technology stack, and rationale.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Service Catalogue](#3-service-catalogue)
4. [Technology Stack](#4-technology-stack)
5. [Inter-Service Communication](#5-inter-service-communication)
6. [Data Flow: Trip Generation](#6-data-flow-trip-generation)
7. [API Contracts](#7-api-contracts)
8. [RAG Layer](#8-rag-layer)
9. [Database Design](#9-database-design)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [Security](#12-security)
13. [Observability](#13-observability)
14. [Performance & Caching](#14-performance--caching)
15. [MVP Scope & Constraints](#15-mvp-scope--constraints)
16. [Roadmap](#16-roadmap)

---

## 1. System Overview

AI-powered travel itinerary planner that generates personalized, day-by-day trip plans . The system combines real-time weather data, live POI data, and vector-retrieved travel heuristics (RAG) to produce a structured itinerary via LLM, streamed to the user in real time.

**Core value propositions:**

- Personalized itineraries driven by real-time data, not static content
- Seasonality and weather-aware planning
- Explainable recommendations (every suggestion is grounded in fetched data)
- Scalable multi-agent architecture, extensible to new destinations and agents

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                        │
│          React 19 · Vite · Zustand · TanStack Query          │
│                                                              │
│  Trip Setup Wizard ──── REST ────► Planner BE               │
│  Plan Result Page ──── WS ──────► Itinerary Agent           │
│                   ──── REST ────► Location Agent             │
└──────────────────────────────────────────────────────────────┘
              │ REST                           │ WebSocket
              ▼                               ▼
┌─────────────────────┐           ┌───────────────────────────┐
│   Planner BE :7016  │           │  Itinerary Agent :7020    │
│  ─────────────────  │           │  ────────────────────     │
│  Destination        │           │  Orchestrator             │
│  Validation (LLM)   │           │  OpenAI tool-call loop    │
│  Clarification Q&A  │           │  RAG retrieval (Qdrant)   │
└─────────────────────┘           │  WebSocket streaming      │
                                  └───────────┬───────────────┘
                                              │ MCP (Streamable HTTP)
                          ┌───────────────────┴───────────────────┐
                          │                                       │
              ┌───────────▼──────────┐           ┌───────────────▼──────────┐
              │  Weather Agent :7018 │           │  Location Agent :7019    │
              │  ─────────────────── │           │  ───────────────────────  │
              │  MCP server          │           │  MCP server               │
              │  get_forecast tool   │           │  get_poi tool             │
              │  Open-Meteo API      │           │  Google Places API        │
              │  PostgreSQL cache    │           │  Geoapify API             │
              └──────────────────────┘           │  PostgreSQL cache         │
                                                 └──────────────────────────┘

                                  ┌──────────────────┐
                                  │  Qdrant :6333    │
                                  │  travel_patterns │
                                  │  (vector store)  │
                                  └──────────────────┘

                           ┌──────────────────────────┐
                           │  Ingest (offline script) │
                           │  OpenAI → embeddings     │
                           │  → upload to Qdrant      │
                           └──────────────────────────┘
```

---

## 3. Service Catalogue

### 3.1 Planner BE (`ai-travel-planner-be`) — Port 7016

**Role:** Entry point for user trip setup. Validates the destination and user intent using an LLM and returns a normalized, structured intent object.

**Responsibilities:**

- Accept raw user input (destination, dates, budget, preferences)
- Validate and geocode destination via Geocoding API
- Use OpenAI to extract and normalize intent parameters
- Return clarification questions if intent is ambiguous
- Health-check endpoint

**Key routes:**

```
POST /api/v1/validation/destination   → destination validation + LLM normalization
GET  /alive                           → health check
```

**Does NOT:** generate itineraries, call weather or location APIs, maintain long-lived state.

---

### 3.2 Itinerary Agent (`ai-itenerary-agent`) — Port 7020

**Role:** Central orchestrator. Accepts a validated trip intent, calls weather and location agents via MCP, retrieves travel patterns from Qdrant, then drives the OpenAI tool-call loop to assemble and stream the final itinerary.

**Responsibilities:**

- Accept `POST /api/v1/travel-plan/generate` to enqueue a plan job
- Return a `jobId` immediately; emit progress over WebSocket `GET /api/v1/ws?jobId=`
- Retrieve relevant travel patterns from Qdrant (semantic search on embeddings)
- Call `get_forecast` (Weather Agent MCP) and `get_poi` (Location Agent MCP) as OpenAI tool calls
- Assemble final structured itinerary JSON
- Stream events: `progress`, `chunk`, `complete`, `error`

**Key routes:**

```
POST /api/v1/travel-plan/generate     → start job, returns { jobId }
GET  /api/v1/ws?jobId=<id>           → WebSocket stream of plan events
GET  /alive                           → health check
```

**MCP clients (outbound):**

```
AI_WEATHER_AGENT_URL  → <weather-agent>/mcp
AI_LOCATION_AGENT_URL → <location-agent>/mcp
```

---

### 3.3 Weather Agent (`ai-weather-agent`) — Port 7018

**Role:** Thin, stateless weather data service exposed as an MCP server. Translates trip coordinates and dates into actionable weather constraints for the itinerary planner.

**Responsibilities:**

- Expose `get_forecast` MCP tool
- Support **Forecast Mode** (exact dates within 16-day window) via Open-Meteo Forecast API
- Support **Climate Mode** (month-only) via Open-Meteo Historical Archive API (last 3–5 years averaged)
- Derive itinerary-friendly constraint flags (rain risk, heat risk, wind risk)

**MCP tool: `get_forecast`**

Input:

```ts
{
  destination: string
  lat: number
  lon: number
  startDate?: string 
  endDate?: string
=
}
```

Output:

```ts
{
  mode: "forecast" | "archive"
  summary: string
  daily: WeatherDay[]
  constraints: WeatherConstraints
  warnings: string[]
  providerMeta: WeatherProviderMeta[]
}
```

**Constraint derivation rules:**


| Metric    | Low               | Medium     | High      |
| --------- | ----------------- | ---------- | --------- |
| Rain risk | precip prob < 30% | 30–60%     | > 60%     |
| Heat risk | temp_max < 30°C   | 30–34°C    | ≥ 35°C    |
| Wind risk | wind < 25 km/h    | 25–40 km/h | > 40 km/h |


Derived flags: `indoorRecommended`, `planFlexibleOutdoorActivities`, `avoidBoatTrips`, `preferMorningOutdoorActivities`

**External API:** Open-Meteo (free, no key required for base usage). OpenWeather reserved as optional upgrade.

---

### 3.4 Location Agent (`ai-location-agent`) — Port 7019

**Role:** POI search and normalization service, exposed as an MCP server. Resolves destination geometry and fetches Points of Interest from external providers.

**Responsibilities:**

- Expose `get_poi` MCP tool
- Geocode destination (and optional area) using Geoapify Geocoding API
- Build spatial filter (place, circle, or rect) for POI search
- Fetch POI per category in parallel with concurrency limit
- Normalize responses to a provider-agnostic `NormalizedPlace` schema
- Optionally enrich top-N results with Google Places (ratings, price level, hours)
- Deduplicate places (by provider ID, name similarity, < 50m proximity)
- Rank places by completeness and quality of data

**MCP tool: `get_poi`**

Input:

```ts
{
  categories: {
     {
        searchQuery: string,
        count: number
     }
  }
}
```

**Provider strategy:**

1. **Google Places** (rating, price level, hours, Maps URI)

---

### 3.5 Ingest (`ingest`) — Offline Script

**Role:** One-time / periodic data pipeline that generates travel heuristic patterns via OpenAI and uploads them as vector embeddings to Qdrant.

**Flow:**

```
generate-travel-patterns.ts
  → GPT-4o generates structured pattern JSON
  → saved to ingest/output/travel-patterns.json

upload-travel-patterns-to-qdrant.ts
  → reads patterns JSON
  → generates text-embedding-3-small embeddings via OpenAI
  → upserts points into Qdrant collection "travel_patterns"
```

**Embedding text format:**

```
Destination: Phuket
Season: May rainy season
Budget: mid
Pattern: In rainy season keep outdoor plans flexible
```

---

## 4. Technology Stack

### 4.1 Backend Services (×4)


| Technology                              | Version    | Rationale                                                                                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| **Node.js**                             | 20+ LTS    | Async I/O ideal for orchestrating multiple external API calls concurrently; large ecosystem                   |
| **TypeScript**                          | 5.8        | Type safety across service boundaries; shared interface definitions catch contract mismatches at compile time |
| **Express**                             | 5.x        | Minimal, well-understood HTTP framework; v5 includes built-in async error handling                            |
| `**@modelcontextprotocol/sdk`**         | 1.29       | Official MCP SDK; standardizes tool exposure and discovery between agents without custom RPC                  |
| `**ws`**                                | 8.x        | Lightweight WebSocket library; used by Itinerary Agent for streaming plan progress to the browser             |
| **OpenAI SDK**                          | 6.x        | Tool-call orchestration (function calling), embeddings generation, chat completions                           |
| `**@qdrant/js-client-rest`**            | 1.18       | REST client for Qdrant vector store; used for semantic retrieval of travel patterns                           |
| **class-validator + class-transformer** | 0.14 / 0.5 | DTO validation on all incoming requests; decorator-based, ergonomic with TypeScript                           |
| **winston + winston-daily-rotate-file** | 3.x        | Structured JSON logging with automatic log rotation; consistent across all services                           |
| **morgan**                              | 1.x        | HTTP request logging middleware                                                                               |
| **nodemon**                             | 3.x        | Development auto-restart                                                                                      |
| **tsc + tsc-alias**                     | —          | TypeScript compilation with path alias resolution for production builds                                       |


### 4.2 Frontend


| Technology               | Version | Rationale                                                                           |
| ------------------------ | ------- | ----------------------------------------------------------------------------------- |
| **React**                | 19      | Latest concurrent features; fine-grained rendering for streaming updates            |
| **TypeScript**           | 5.9     | Strict type checking; path alias `@/`* → `src/`*                                    |
| **Vite**                 | 7.x     | Fastest HMR in development; optimized ESM builds for production                     |
| **Tailwind CSS**         | 4.2     | Utility-first; zero dead CSS in production via Vite plugin integration              |
| **shadcn/ui**            | 4.x     | Unstyled Radix UI primitives + Tailwind recipes; full ownership of component source |
| **Radix UI**             | 1.x     | Accessible headless primitives (popover, calendar, etc.)                            |
| **React Router DOM**     | 7.x     | Client-side routing; nested routes with layout wrapper                              |
| **TanStack React Query** | 5.x     | Server state management, caching, and background refetching for REST calls          |
| **Zustand**              | 5.x     | Lightweight client state store for trip setup wizard progression and result state   |
| **Axios**                | 1.x     | HTTP client with interceptors for error normalization                               |
| **date-fns**             | 4.x     | Date manipulation for trip date ranges                                              |
| **sonner**               | 2.x     | Toast notifications                                                                 |
| **lucide-react**         | 1.x     | Icon library                                                                        |


### 4.3 Infrastructure


| Technology            | Rationale                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Qdrant** (Docker)   | Purpose-built vector database; native filtering on payload fields (destination, season, budget); persistent volume via Docker |
| **Open-Meteo**        | Free, coordinate-based weather API supporting both forecast (16-day) and historical archive; no key required for base usage   |
| **Google Places API** | Rich POI enrichment (ratings, hours, Maps URI); used only for top-N results to control cost                                   |
| **Geoapify**          | Geocoding + base POI search; free tier covers MVP load                                                                        |
| **OpenAI**            | `gpt-4o` for validation, intent extraction, and itinerary generation; `text-embedding-3-small` for pattern embeddings         |
| **Docker Compose**    | Qdrant only; application services run as Node processes (Dockerfiles not yet in repo)                                         |


---

## 5. Inter-Service Communication

### 5.1 Browser → Backend (REST + WebSocket)

```
Browser
  ├── POST  http://PLANNER_BE/api/v1/validation/destination
  │         → validates destination + LLM intent normalization
  │
  ├── GET   http://LOCATION_AGENT/api/v1/location/...
  │         → direct POI/interest data for UI form step
  │
  ├── POST  http://ITINERARY_AGENT/api/v1/travel-plan/generate
  │         → initiates plan job, returns { jobId }
  │
  └── WS    ws://ITINERARY_AGENT/api/v1/ws?jobId=<id>
            → streams: progress | chunk | complete | error
```

### 5.2 Itinerary Agent → Tool Agents (MCP Streamable HTTP)

The Itinerary Agent connects to Weather and Location agents as **MCP clients** at startup. During plan generation, OpenAI's tool-call mechanism invokes MCP tools transparently:

```
Itinerary Agent (MCP client)
  ├── POST <WEATHER_AGENT_URL>/mcp   → get_forecast tool
  └── POST <LOCATION_AGENT_URL>/mcp → get_poi tool
```

**Why MCP?** Standardized tool discovery and invocation contract; agents are independently deployable and replaceable; tool schemas are machine-readable so OpenAI can self-describe them in the system prompt without manual maintenance.

### 5.3 Itinerary Agent → Qdrant (REST)

```
Itinerary Agent
  └── POST http://QDRANT_HOST:6333/collections/travel_patterns/points/search
            body: { vector: <embedding>, filter: { destination, season, budget }, top: 5 }
```

---

## 6. Data Flow: Trip Generation

```
Step 1 — User fills Trip Setup Wizard (FE)
  Destination → Dates → Budget → Interests → Preferences

Step 2 — Destination Validation (FE → Planner BE)
  POST /validation/destination
  LLM extracts and validates intent parameters
  Returns: { destination, area, days, month, budget, preferences, style, constraints }
  May return clarification questions if intent is ambiguous

Step 3 — Generate Trip Plan (FE → Itinerary Agent)
  POST /travel-plan/generate { ...normalizedIntent }
  Returns: { jobId }
  WS connection opened: ws://.../ws?jobId=<id>

Step 4 — Itinerary Agent orchestration loop
  a. Embed trip context → semantic search in Qdrant → top-5 travel patterns
  b. OpenAI system prompt assembled:
       - Travel expert persona + output format contract
       - Qdrant patterns (planning heuristics)
       - Tool availability: get_forecast, get_poi
  c. OpenAI generates tool call: get_forecast(lat, lon, days, startDate|month)
  d. Itinerary Agent → Weather Agent MCP → Open-Meteo API
     Returns: WeatherConstraints + daily forecast
  e. OpenAI generates tool call: get_poi(destination, preferences, budget, constraints)
  f. Itinerary Agent → Location Agent MCP → Google Places
     Returns: NormalizedPlace[] per category
  g. OpenAI generates final itinerary JSON with all context injected
  h. Itinerary streamed to browser via WebSocket

Step 5 — FE renders TravelPlanDisplay
  Structured day-by-day plan with places, times, weather notes
```

---

## 7. API Contracts

### 7.1 Intent Parameters (normalized by Planner BE)

```ts
{
  destination: string              // "Phuket"
  area?: string                    // "Bang Tao"
  days: number                     // 1–7
  month?: string                   // "May"
  startDate?: string               // "2026-05-10" (YYYY-MM-DD)
  budget: "low" | "mid" | "high"
  preferences: PlacePreference[]   // ["beaches", "cafes"]
  style?: TravelStyle[]            // ["chill", "romantic"]
  constraints?: TravelConstraint[] // ["indoor_if_rain"]
  lang?: "en" | "ru"
}
```

### 7.2 WebSocket Events (Itinerary Agent → Browser)

```ts
// progress update
{ type: "progress", message: string, step: number, total: number }

// streaming chunk
{ type: "chunk", content: string }

// final complete payload
{ type: "complete", plan: TravelPlan }

// error
{ type: "error", message: string, code: string }
```

### 7.3 TravelPlan (output schema)

```ts
{
  destination: string
  days: Day[]
  weatherSummary: string
  generalTips: string[]
}

Day {
  dayNumber: number
  date?: string
  label: string
  theme: string
  activities: Activity[]
}

Activity {
  time: string           // "09:00"
  name: string
  category: string
  description: string
  place?: NormalizedPlace
  weatherNote?: string
  tip?: string
}
```

---

## 8. RAG Layer

### 8.1 Purpose

Provide the LLM with curated planning heuristics grounded in real traveler patterns, rather than relying on general world knowledge. This reduces hallucination and makes recommendations seasonality-aware and budget-aware.

### 8.2 Pattern Schema

```ts
{
  id: string          // uuid
  title: string
  destination: string // "Phuket"
  season: string      // "rainy" | "dry" | "shoulder" | "May" | ...
  budgetLevel: string // "low" | "mid" | "high"
  travelerType: string// "couple" | "family" | "solo" | "group"
  patternText: string // natural language planning rule
  confidence: number  // 0–1
  createdAt: string
}
```

**Example patterns:**

- `"Arrival day should be kept light — allow for settling in and orientation."`
- `"In rainy season, plan indoor alternatives for every outdoor activity."`
- `"Group attractions by geographic proximity to minimize transit time."`
- `"Low-budget travelers should prioritize free beaches and street food over restaurants."`

### 8.3 Retrieval Strategy

1. Build embedding text from current trip context:
  ```
   Destination: Phuket | Season: May | Budget: mid | Traveler: couple
  ```
2. Generate embedding via `text-embedding-3-small`
3. Qdrant cosine similarity search with payload filters:
  ```json
   { "must": [{ "key": "destination", "match": { "value": "Phuket" } }] }
  ```
4. Retrieve top-5 patterns; inject as bulleted list into LLM system prompt

### 8.4 Qdrant Collection

```
Collection: travel_patterns
Vector size: 1536  (text-embedding-3-small)
Distance: Cosine
Indexed payload fields: destination, season, budgetLevel, travelerType
```

### 8.5 Ingest Pipeline (offline)

```bash
# 1. Generate patterns JSON via OpenAI
npm run generate             # → ingest/output/travel-patterns.json

# 2. Upload embeddings to Qdrant
npm run upload:qdrant
```

Re-run ingest when new destinations, seasons, or traveler types are added.

---

Weather Agent and Location Agent cache external API responses to reduce latency and cost.

**Cache keys and TTL:**


| Agent    | Cache Key Pattern                                  | TTL          |
| -------- | -------------------------------------------------- | ------------ |
| Location | `geocode:{query}:{lang}`                           | 7–30 days    |
| Location | `places:{provider}:{category}:{filter}:{limit}`    | 1–7 days     |
| Location | `google_enrichment:{place_id}`                     | 7 days       |
| Weather  | `weather:forecast:{lat}:{lon}:{startDate}:{days}`  | 1–3 hours    |
| Weather  | `weather:climate:{lat}:{lon}:{month}:{yearsRange}` | 30–90 days   |
| Weather  | `weather:error:{...}`                              | 5–15 minutes |


---

## 10. Frontend Architecture

### 10.1 Structure

```
src/
├── app/
│   ├── index.tsx           # Root component, React Query provider, Router
│   ├── providers/          # Context providers (QueryClient, etc.)
│   ├── router/             # Route definitions (/, /plan/result)
│   └── styles/             # Global CSS (glass.css, marketing.css)
├── modules/
│   └── TripSetup/          # Feature module
│       ├── TripSetupModule.tsx      # Main wizard orchestrator
│       ├── components/
│       │   ├── DestinationForm.tsx
│       │   ├── DatesBudgetForm.tsx
│       │   ├── InterestsForm.tsx
│       │   ├── AdditionalPreferencesForm.tsx
│       │   ├── TripSetupSummary.tsx
│       │   ├── PlanGeneratingOverlay.tsx
│       │   └── TravelPlanDisplay.tsx
│       ├── api/
│       │   ├── travelPlanner.api.ts  # REST calls to Planner BE
│       │   ├── itineraryPlan.ws.ts   # WebSocket client for plan streaming
│       │   └── validation.ts
│       ├── model/
│       │   ├── scheme.ts              # Zod/validation schemas
│       │   ├── tripSetup.interface.ts
│       │   └── travel-plan-result.interface.ts
│       ├── store/
│       │   ├── tripSetup.store.ts     # Zustand: wizard form state
│       │   └── tripResult.store.ts    # Zustand: generated plan state
│       ├── queries/
│       │   └── validation.query.ts    # TanStack Query hooks
│       └── utils/
│           └── normalizeClarificationOptions.ts
├── pages/
│   ├── MainPage.tsx         # Trip setup entry
│   └── PlanResultPage.tsx   # Plan display
└── shared/
    ├── api/
    │   ├── client.ts         # Axios instances per service
    │   └── normalizeApiError.ts
    ├── constants/routes.ts
    ├── hooks/useTypewriter.ts
    ├── errors/AppError.ts
    └── ui/                   # shadcn/ui + custom shared components
```

### 10.2 State Management

- **Zustand** — synchronous client state: wizard step, form values, trip result
- **TanStack React Query** — server state: destination validation (query with caching)
- **WebSocket** — streaming itinerary events; state written into Zustand `tripResult.store`

### 10.3 Routing

```
/              → MainPage     (TripSetupModule — multi-step wizard)
/plan/result   → PlanResultPage (TravelPlanDisplay)
```

### 10.4 Environment Variables

```
VITE_TRAVEL_PLANNER_API_URL      # Planner BE base URL
VITE_LOCATION_AGENT_API_URL      # Location Agent base URL
VITE_ITINERARY_AGENT_API_URL     # Itinerary Agent base URL (also used for WS)
```

---

## 11. Infrastructure & Deployment

### 11.1 Current State

```
┌──────────────────────────────────────────────┐
│  Host machine (macOS / Linux)                │
│                                              │
│  node ai-travel-planner-be/dist/main.js      │  :7016
│  node ai-itenerary-agent/dist/main.js        │  :7020
│  node ai-location-agent/dist/main.js         │  :7019
│  node ai-weather-agent/dist/main.js          │  :7018
│  vite dev (FE)                               │  :5173
│                                              │
│  docker compose up -d  (Qdrant)              │  :6333 / :6334

└──────────────────────────────────────────────┘
```

### 11.2 Build Commands (per service)

```bash
npm run build    # tsc && tsc-alias  →  dist/
npm run dev      # nodemon (TypeScript, watch mode)
npm start        # node dist/main.js
```

### 11.3 Docker Compose

```yaml
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333", "6334:6334"]
    volumes: [qdrant_data:/qdrant/storage]
    healthcheck:
      test: ["CMD-SHELL", "bash -c ':> /dev/tcp/127.0.0.1/6333' || exit 1"]
      interval: 10s
```

### 11.4 Environment Variables (per service)

`**ai-travel-planner-be**`

```
PORT, NODE_ENV, API_VERSION
OPENAI_API_KEY, OPENAI_MODEL
GEOCODING_API_URL
DB_STRING (optional)
```

`**ai-itenerary-agent**`

```
PORT, NODE_ENV, API_VERSION
OPENAI_API_KEY, OPENAI_MODEL, OPENAI_EMBEDDING_MODEL
QDRANT_HOST
AI_WEATHER_AGENT_URL, AI_LOCATION_AGENT_URL
GEOCODING_API_URL
DB_STRING (optional)
```

`**ai-location-agent**`

```
PORT, NODE_ENV, API_VERSION
OPENAI_API_KEY, OPENAI_MODEL
GOOGLE_MAPS_API_KEY, GOOGLE_PLACES_API_KEY, GOOGLE_PLACES_API_URL
DB_STRING
```

`**ai-weather-agent**`

```
PORT, NODE_ENV, API_VERSION
OPEN_METEO_API_URL_FORECAST, OPEN_METEO_API_URL_ARCHIVE
GOOGLE_MAPS_API_KEY (geocoding fallback)
OPENWEATHER_API_KEY (optional)
DB_STRING
```

`**ingest**`

```
OPENAI_API_KEY
QDRANT_HOST, QDRANT_COLLECTION (default: travel_patterns)
```

---

## 12. Security

### 12.1 Implemented / Required


| Area             | Control                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| API keys         | Never exposed to frontend; stored server-side in `.env`                   |
| Input validation | `class-validator` DTOs on all endpoints; `zod` in weather/location agents |
| Date range limit | `days` capped at 7 across all services                                    |
| Category limit   | Max 5 POI categories per request                                          |
| Result limit     | Max 20 POI per category                                                   |
| Error masking    | Internal errors not forwarded to client (`error.middleware.ts`)           |
| CORS             | `cors` middleware on all Express apps                                     |
| Environment      | `.env` files gitignored; `.env.example` files to be added                 |


---

## 12. Observability

### Logging

All services use **Winston** with structured JSON format and daily log rotation (`winston-daily-rotate-file`). HTTP requests are logged via **Morgan**.

Log levels: `error`, `warn`, `info`, `debug`

---

## 13. Performance & Caching

### 13.1 Strategies

- **POI fetching by category runs in parallel** with a concurrency limit (avoid sequential API calls)
- **Qdrant retrieval** is fast (< 500ms) due to vector indexing; no caching needed at agent level
- **Streaming via WebSocket** reduces perceived latency: first content reaches the browser before generation completes

### 13.2 Cost Optimization

- Open-Meteo is free for base usage; OpenWeather is pay-as-you-go and kept optional
- LLM model selection: `gpt-4o` for quality; can downgrade to `gpt-4o-mini` for cost reduction if quality is acceptable

---

## 14. MVP Scope & Constraints

### 14.1 Explicitly Not Supported

- Hotel booking
- Flight search
- Visa information
- Transport planning
- Complex multi-step personalization
- User accounts / authentication (planned Phase 3)

### 15.3 Intent Parameter Contract

```json
{
  "destination": "Phuket",
  "area": "Bang Tao",
  "days": 5,
  "month": "May",
  "budget": "low | mid | high",
  "preferences": ["beaches", "cafes"],
  "style": ["chill", "nightlife", "family"],
  "constraints": ["indoor_if_rain", "cheap_only"]
}
```

---

