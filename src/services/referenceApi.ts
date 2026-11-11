/**
 * Cliente da rota que acha, na foto do cômodo, algo de altura conhecida
 * (a porta, a bancada) para servir de régua.
 */

import { ApiError, callApi } from './apiClient'

const ENDPOINT = '/api/reference'
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

interface RoomReference {
  /** Como dizer à pessoa o que foi marcado: "a porta". */
  readonly label: string
  /** Pontas da referência em fração da foto (0 a 1). */
  readonly bottom: RelativePoint
  readonly top: RelativePoint
  readonly heightCm: number
}

interface RoomReferenceRequest {
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

function isReferenceKind(value: unknown): value is ReferenceKind {
  return typeof value === 'string' && value in KIND_LABELS
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
  let data: Record<string, unknown>
  try {
    data = await callApi(ENDPOINT, { body: { image: imageDataUrl, challengeToken }, signal })
  } catch (error: unknown) {
    if (error instanceof ApiError) return null
    throw error
  }

  const bottom = toPoint(data.bottom)
  const top = toPoint(data.top)
  if (!bottom || !top || typeof data.heightCm !== 'number' || !isReferenceKind(data.kind)) {
    return null
  }
  return { label: KIND_LABELS[data.kind], bottom, top, heightCm: data.heightCm }
}
