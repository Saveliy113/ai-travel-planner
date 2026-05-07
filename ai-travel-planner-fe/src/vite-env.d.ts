/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Full base URL for the location API, including `/api/{version}`
   * (e.g. `http://localhost:7016/api/v1`).
   */
  readonly VITE_LOCATION_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
