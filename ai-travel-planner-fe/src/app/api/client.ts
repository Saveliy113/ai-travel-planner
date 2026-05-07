import axios from "axios"

/**
 * Location HTTP client.
 * Prefer `VITE_LOCATION_API_URL` — full origin + API prefix (e.g. `http://localhost:7016/api/v1`).
 * Otherwise built from `VITE_LOCATION_API` + `VITE_API_VERSION` → `{origin}/api/{version}`.
 */
const locationApiUrl = import.meta.env.VITE_LOCATION_API_URL

export const locationApi = axios.create({
  baseURL: locationApiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
})
