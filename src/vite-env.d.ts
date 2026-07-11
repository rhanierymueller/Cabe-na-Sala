/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Measurement ID do Google Analytics 4 (G-XXXXXXXXXX). Opcional. */
  readonly VITE_GA_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
