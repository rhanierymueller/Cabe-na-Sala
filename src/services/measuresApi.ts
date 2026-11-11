/**
 * Cliente da rota que lê as medidas de um anúncio (texto colado ou print).
 * O navegador nunca fala com o provedor: só com /api/measures.
 */

import { toFurnitureKind } from '../components/furniture/catalog'
import type { FurnitureKind } from '../types/furniture'
import { callApi } from './apiClient'

const ENDPOINT = '/api/measures'
const MESSAGES = {
  unavailable: 'A leitura do anúncio está indisponível no momento.',
  failed: 'Não foi possível ler o anúncio. Digite as medidas.',
}

/** Medidas encontradas; null onde o anúncio não informa. */
export interface AdMeasures {
  readonly widthCm: number | null
  readonly heightCm: number | null
  readonly depthCm: number | null
  /** Tipo de móvel reconhecido; null quando o catálogo não tem nada parecido. */
  readonly kind: FurnitureKind | null
}

interface AdMeasuresRequest {
  readonly text?: string
  readonly imageDataUrl?: string
  /** Token do desafio anti-robô; null quando o ambiente não usa desafio. */
  readonly challengeToken: string | null
  readonly signal: AbortSignal
}

function toMeasure(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/** Lança ApiError com mensagem pronta para mostrar. */
export async function readAdMeasures({
  text,
  imageDataUrl,
  challengeToken,
  signal,
}: AdMeasuresRequest): Promise<AdMeasures> {
  const data = await callApi(
    ENDPOINT,
    { body: { text, image: imageDataUrl, challengeToken }, signal },
    MESSAGES,
  )
  return {
    widthCm: toMeasure(data.widthCm),
    heightCm: toMeasure(data.heightCm),
    depthCm: toMeasure(data.depthCm),
    kind: toFurnitureKind(data.kind),
  }
}
