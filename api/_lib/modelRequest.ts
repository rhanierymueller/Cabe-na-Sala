/**
 * Validações da rota de geração de modelo 3D. Código puro, sem rede, para
 * poder ser testado: toda entrada externa passa por aqui antes de custar
 * dinheiro no provedor.
 */

/** Limite do corpo aceito — a Vercel corta em ~4,5 MB; o cliente envia ~200 KB. */
export const MAX_IMAGE_DATA_URL_LENGTH = 4_000_000
const IMAGE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/
const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/
const ALLOWED_MODEL_HOST_SUFFIXES = ['.fal.media', '.fal.run', '.fal.ai']

export function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_IMAGE_DATA_URL_LENGTH &&
    IMAGE_DATA_URL_PATTERN.test(value)
  )
}

export function isValidRequestId(value: unknown): value is string {
  return typeof value === 'string' && REQUEST_ID_PATTERN.test(value)
}

/** Só devolvemos ao navegador URL https do próprio provedor. */
export function isTrustedModelUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      ALLOWED_MODEL_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
    )
  } catch {
    return false
  }
}

/**
 * A rota só atende o próprio site: o Origin do navegador tem de ser o mesmo
 * host que recebeu a requisição. Sem Origin (curl, script) é recusado.
 */
export function isSameOrigin(originHeader: string | null, hostHeader: string | null): boolean {
  if (!originHeader || !hostHeader) return false
  try {
    return new URL(originHeader).host === hostHeader
  } catch {
    return false
  }
}

export interface RateLimiter {
  /** Registra uma tentativa; devolve false quando o limite foi atingido. */
  readonly tryConsume: (key: string, nowMs: number) => boolean
}

/**
 * Limitador de janela fixa em memória.
 * ponytail: vale por instância da função — instâncias novas zeram a conta.
 * Segura abuso casual; para valer de verdade, trocar por Vercel KV/Upstash
 * e ligar o limite de gasto no painel do provedor.
 */
export function createRateLimiter(maxPerWindow: number, windowMs: number): RateLimiter {
  const hitsByKey = new Map<string, readonly number[]>()

  return {
    tryConsume(key, nowMs) {
      const recentHits = (hitsByKey.get(key) ?? []).filter((hitMs) => nowMs - hitMs < windowMs)
      if (recentHits.length >= maxPerWindow) {
        hitsByKey.set(key, recentHits)
        return false
      }
      hitsByKey.set(key, [...recentHits, nowMs])
      return true
    },
  }
}

/** Primeiro IP do x-forwarded-for — o do cliente, segundo a Vercel. */
export function clientIpFrom(forwardedFor: string | null): string {
  return forwardedFor?.split(',')[0]?.trim() || 'desconhecido'
}
