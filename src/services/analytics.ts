/**
 * Google Analytics 4 com carregamento condicional: sem VITE_GA_ID definido
 * (dev local, forks), tudo vira no-op — nenhum script externo é carregado.
 *
 * O funil, na ordem em que a pessoa anda pelo site:
 *   view_landing       → chegou na página inicial
 *   landing_start      → clicou em "Ver na minha casa" na página inicial
 *   view_tool          → chegou na ferramenta (pela inicial ou por um link)
 *   select_furniture   → trocou de móvel no seletor
 *   photo_model_start  → enviou a foto do anúncio (ou um .glb)
 *   photo_model_ready  → o modelo da foto apareceu
 *   photo_model_failed → a foto não virou modelo
 *   launch_ar          → tocou em "Ver na minha casa" (a métrica-mãe)
 *   share_click        → enviou para quem decide junto
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const ANALYTICS_EVENT_NAMES = [
  'view_landing',
  'landing_start',
  'view_tool',
  'select_furniture',
  'photo_model_start',
  'photo_model_ready',
  'photo_model_failed',
  'launch_ar',
  'share_click',
] as const

type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

type AnalyticsParams = Readonly<Record<string, string | number | boolean>>

/** ID público de medição do GA4 (propriedade "Cabe na Sala"). */
const PRODUCTION_GA_ID = 'G-X65M40LX42'

/** Em dev o GA fica desligado (sem VITE_GA_ID) para não sujar as métricas. */
const GA_MEASUREMENT_ID: string | undefined =
  import.meta.env.VITE_GA_ID ?? (import.meta.env.PROD ? PRODUCTION_GA_ID : undefined)

let isInitialized = false

export function initAnalytics(): void {
  if (GA_MEASUREMENT_ID === undefined || GA_MEASUREMENT_ID === '' || isInitialized) return
  isInitialized = true

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag() {
    // O GA espera o objeto `arguments` no dataLayer, não um array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true })
}

export function trackEvent(name: AnalyticsEventName, params?: AnalyticsParams): void {
  if (!isInitialized || window.gtag === undefined) return
  window.gtag('event', name, params ?? {})
}
