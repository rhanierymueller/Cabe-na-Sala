/**
 * Detecção de plataforma para o fluxo de AR: o Quick Look só existe no
 * Safari do iOS, então cada plataforma sem suporte ganha uma saída útil
 * (iPhone/Chrome → abrir no Safari; Android → aviso; desktop → QR).
 */
export type Platform = 'ios' | 'android' | 'desktop'

export function detectPlatform(
  userAgent: string = navigator.userAgent,
  maxTouchPoints: number = navigator.maxTouchPoints,
): Platform {
  const isClassicIos = /iPhone|iPad|iPod/.test(userAgent)
  // iPadOS se apresenta como Mac, mas Macs não têm tela de toque.
  const isIpadOs = /Macintosh/.test(userAgent) && maxTouchPoints > 1
  if (isClassicIos || isIpadOs) return 'ios'

  if (/Android/.test(userAgent)) return 'android'

  return 'desktop'
}

/** Origem canônica do site em produção. */
export const CANONICAL_ORIGIN = 'https://cabenasala.com'

/**
 * Esquema do iOS que abre uma URL diretamente no Safari — a saída para quem
 * chega pelo Chrome/Firefox no iPhone, onde o AR não funciona. O esquema só
 * existe na variante https (x-safari-https), então o link é sempre montado
 * sobre a origem canônica de produção, preservando a configuração atual
 * (?movel=...&l=...) — o que também torna o botão testável a partir do dev.
 */
export function buildSafariDeepLink(url: string): string {
  const { search } = new URL(url)
  return `x-safari-${CANONICAL_ORIGIN}/${search}`
}
