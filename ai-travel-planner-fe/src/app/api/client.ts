import axios from "axios"

/**
 * Travel planner backend HTTP client.
 * Prefer `VITE_TRAVEL_PLANNER_API_URL` — full origin + API prefix (e.g. `http://localhost:7016/api/v1`).
 * Otherwise built from `VITE_LOCATION_API` + `VITE_API_VERSION` → `{origin}/api/{version}`.
 */
const travelPlannerApiUrl = import.meta.env.VITE_TRAVEL_PLANNER_API_URL
const itineraryAgentApiUrl = import.meta.env.VITE_ITINERARY_AGENT_API_URL
const locationAgentApiUrl = import.meta.env.VITE_LOCATION_AGENT_API_URL

export const travelPlannerApi = axios.create({
  baseURL: travelPlannerApiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
})

/** Itinerary service (travel plan + setup generate); base URL includes `/api/{version}`. */
export const itineraryAgentApi = axios.create({
  baseURL: itineraryAgentApiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
})

export const locationAgentApi = axios.create({
  baseURL: locationAgentApiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
})
