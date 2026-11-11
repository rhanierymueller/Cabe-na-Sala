/**
 * Cliente da rota que lê as medidas de um anúncio (texto colado ou print).
 * O navegador nunca fala com o provedor: só com /api/medidas.
 */

const ENDPOINT = '/api/medidas'
const GENERIC_ERROR_MESSAGE = 'Não foi possível ler o anúncio. Digite as medidas.'

/** Erro com mensagem pronta para mostrar ao usuário. */
export class MeasuresApiError extends Error {
  constructor(message: string = GENERIC_ERROR_MESSAGE) {
    super(message)
    this.name = 'MeasuresApiError'
  }
}

/** Medidas encontradas; null onde o anúncio não informa. */
export interface AdMeasures {
  readonly widthCm: number | null
  readonly heightCm: number | null
  readonly depthCm: number | null
}

export interface AdMeasuresRequest {
  readonly text?: string
  readonly imageDataUrl?: string
  /** Token do desafio anti-robô; null quando o ambiente não usa desafio. */
  readonly challengeToken: string | null
  readonly signal: AbortSignal
}

function toMeasure(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export async function readAdMeasures({
  text,
  imageDataUrl,
  challengeToken,
  signal,
}: AdMeasuresRequest): Promise<AdMeasures> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, image: imageDataUrl, challengeToken }),
    signal,
  })

  let envelope: { success?: unknown; data?: unknown; error?: unknown }
  try {
    envelope = (await response.json()) as typeof envelope
  } catch {
    // Resposta sem JSON: a rota não existe neste ambiente ou caiu.
    throw new MeasuresApiError('A leitura do anúncio está indisponível no momento.')
  }

  if (!response.ok || envelope.success !== true || typeof envelope.data !== 'object' || !envelope.data) {
    throw new MeasuresApiError(typeof envelope.error === 'string' ? envelope.error : undefined)
  }
  const data = envelope.data as Record<string, unknown>
  return {
    widthCm: toMeasure(data.widthCm),
    heightCm: toMeasure(data.heightCm),
    depthCm: toMeasure(data.depthCm),
  }
}
