import axios from "axios"

/**
 * Location module HTTP client — base URL from `VITE_LOCATION_API` (Location / validation backend).
 */
const locationApiUrl= import.meta.env.VITE_LOCATION_API ?? ""

export const locationApi = axios.create({
  baseURL: locationApiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000,
})
