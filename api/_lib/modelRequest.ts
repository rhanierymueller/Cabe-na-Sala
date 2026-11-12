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

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp'

/** Separa tipo e conteúdo de um data URL já validado por isValidImageDataUrl. */
export function splitImageDataUrl(
  dataUrl: string,
): { readonly mediaType: ImageMediaType; readonly data: string } | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(dataUrl)
  return match ? { mediaType: match[1] as ImageMediaType, data: match[2] } : null
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

/** Nome do site que fez o pedido, a partir de um Origin já aprovado por isSameOrigin. */
export function originHostname(originHeader: string | null): string {
  try {
    return new URL(originHeader ?? '').hostname
  } catch {
    return ''
  }
}

/** Bytes iniciais de cada formato aceito — o que o arquivo é de verdade. */
const IMAGE_SIGNATURES: Readonly<Record<string, (bytes: Uint8Array) => boolean>> = {
  jpeg: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  png: (bytes) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b),
  webp: (bytes) =>
    asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP'),
}
/** Caracteres base64 suficientes para decodificar o cabeçalho do arquivo. */
const SIGNATURE_BASE64_CHARS = 24

function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  return [...text].every((char, index) => bytes[offset + index] === char.charCodeAt(0))
}

/**
 * O tipo declarado no data URL tem de bater com o conteúdo: impede mandar
 * outro tipo de arquivo ao provedor dizendo que é uma foto.
 */
export function imageContentMatchesType(dataUrl: string): boolean {
  const match = /^data:image\/(jpeg|png|webp);base64,(.*)$/s.exec(dataUrl)
  if (!match) return false
  const [, type, payload] = match
  const header = Uint8Array.from(Buffer.from(payload.slice(0, SIGNATURE_BASE64_CHARS), 'base64'))
  return IMAGE_SIGNATURES[type]?.(header) ?? false
}

interface SegmenterResult {
  readonly model_glb?: { readonly url?: unknown }
  readonly individual_glbs?: readonly { readonly url?: unknown }[]
  readonly metadata?: readonly { readonly object_index?: unknown; readonly scale?: unknown }[]
}

/** Maior fator de escala do objeto ([[sx, sy, sz]]); 0 quando o formato não é esse. */
function largestScale(scale: unknown): number {
  const factors = [scale].flat(2).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return factors.length > 0 ? Math.max(...factors.map(Math.abs)) : 0
}

/**
 * URL do modelo a mostrar. Quando acha vários objetos, o SAM 3D devolve em
 * `model_glb` a cena combinada; o site precisa de um só, então fica o maior,
 * que num anúncio costuma ser o produto.
 */
export function pickModelUrl(data: unknown): unknown {
  const result = (data ?? {}) as SegmenterResult
  const objects = result.individual_glbs ?? []
  if (objects.length < 2) return result.model_glb?.url

  const sizes = objects.map((_, index) => {
    const entry = result.metadata?.find((item) => item?.object_index === index) ?? result.metadata?.[index]
    return largestScale(entry?.scale)
  })
  return objects[sizes.indexOf(Math.max(...sizes))]?.url
}

/** Sec-Fetch-Site vem do navegador e não pode ser forjado por script de página. */
export function isCrossSiteFetch(secFetchSite: string | null): boolean {
  return secFetchSite !== null && secFetchSite !== 'same-origin'
}

const UNKNOWN_CLIENT = 'desconhecido'
/** Cabeçalhos de IP em ordem de confiança: os dois primeiros são escritos pela Vercel. */
const CLIENT_IP_HEADERS = ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for'] as const

/**
 * IP do cliente para o limite de uso. Prefere os cabeçalhos que a plataforma
 * define (o cliente não consegue forjar); x-forwarded-for é só o último recurso.
 * Sem IP, todos caem na mesma chave — o limite fica mais rígido, não mais frouxo.
 */
export function clientIpFrom(headers: Pick<Headers, 'get'>): string {
  for (const name of CLIENT_IP_HEADERS) {
    const firstAddress = headers.get(name)?.split(',')[0]?.trim()
    if (firstAddress) return firstAddress
  }
  return UNKNOWN_CLIENT
}
