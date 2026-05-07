/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for location / validation API (Vite: `LOCATION_API` → `VITE_LOCATION_API`) */
  readonly VITE_LOCATION_API?: string
  readonly VITE_API_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
