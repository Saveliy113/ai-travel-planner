/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Full base URL for the travel planner backend (validation), including `/api/{version}`
   * (e.g. `http://localhost:7016/api/v1`).
   */
  readonly VITE_TRAVEL_PLANNER_API_URL?: string
  /** Itinerary / travel-plan service base URL including `/api/{version}` (e.g. `http://localhost:7018/api/v1`). */
  readonly VITE_ITINERARY_AGENT_API_URL?: string
  /** Location-interest microservice base URL including `/api/{version}`. */
  readonly VITE_LOCATION_AGENT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
