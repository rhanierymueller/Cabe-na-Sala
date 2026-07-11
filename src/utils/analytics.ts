/**
 * Google Analytics 4 com carregamento condicional: sem VITE_GA_ID definido
 * (dev local, forks), tudo vira no-op — nenhum script externo é carregado.
 *
 * Eventos do funil que definem o produto:
 *   view_tool     → chegou na ferramenta
 *   verdict_shown → viu o veredito "passa na porta?"
 *   launch_ar     → tocou em "Ver na minha casa" (a métrica-mãe)
 *   share_click   → enviou para quem decide junto
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export type AnalyticsEventName = 'view_tool' | 'verdict_shown' | 'launch_ar' | 'share_click'

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
