/**
 * Cliente da rota que acha, na foto do cômodo, algo de altura conhecida
 * (a porta, a bancada) para servir de régua.
 */

const ENDPOINT = '/api/referencia'
const KIND_LABELS = {
  door: 'a porta',
  counter: 'a bancada',
  ceiling: 'a parede, do chão ao teto',
} as const
type ReferenceKind = keyof typeof KIND_LABELS

interface RelativePoint {
  readonly x: number
  readonly y: number
}

export interface RoomReference {
  /** Como dizer à pessoa o que foi marcado: "a porta". */
  readonly label: string
  /** Pontas da referência em fração da foto (0 a 1). */
  readonly bottom: RelativePoint
  readonly top: RelativePoint
  readonly heightCm: number
}

export interface RoomReferenceRequest {
  readonly imageDataUrl: string
  /** Token do desafio anti-robô; null quando o ambiente não usa desafio. */
  readonly challengeToken: string | null
  readonly signal: AbortSignal
}

function toPoint(value: unknown): RelativePoint | null {
  const point = value as { x?: unknown; y?: unknown } | null
  return typeof point?.x === 'number' && typeof point.y === 'number'
    ? { x: point.x, y: point.y }
    : null
}

/**
 * Devolve a referência encontrada, ou null quando a foto não tem nenhuma ou
 * o serviço não está disponível: nos dois casos a pessoa marca à mão, então
 * não é erro para mostrar.
 */
export async function findRoomReference({
  imageDataUrl,
  challengeToken,
  signal,
}: RoomReferenceRequest): Promise<RoomReference | null> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl, challengeToken }),
    signal,
  })
  if (!response.ok) return null

  const envelope = (await response.json()) as { data?: Record<string, unknown> | null }
  const data = envelope.data
  const bottom = toPoint(data?.bottom)
  const top = toPoint(data?.top)
  const kind = data?.kind
  if (!data || !bottom || !top || typeof data.heightCm !== 'number') return null
  if (typeof kind !== 'string' || !(kind in KIND_LABELS)) return null

  return { label: KIND_LABELS[kind as ReferenceKind], bottom, top, heightCm: data.heightCm }
}
