/**
 * Cliente da rota de servidor que transforma foto em modelo 3D.
 * O navegador nunca fala com o provedor: só com /api/model3d.
 */

import { toFurnitureKind } from '../components/furniture/catalog'
import type { FurnitureKind } from '../types/furniture'
import { ApiError, callApi } from './apiClient'

const ENDPOINT = '/api/model3d'
const POLL_INTERVAL_MS = 3000
/** A geração costuma levar ~1 min; depois disso desistimos com mensagem clara. */
const GENERATION_TIMEOUT_MS = 4 * 60 * 1000
const MESSAGES = {
  unavailable: 'A geração por foto está indisponível no momento.',
  failed: 'Não foi possível gerar o modelo. Tente de novo.',
}

function wait(durationMs: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, durationMs)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(signal.reason)
      },
      { once: true },
    )
  })
}

interface GenerationRequest {
  readonly imageDataUrl: string
  /** Token do desafio anti-robô; null quando o ambiente não usa desafio. */
  readonly challengeToken: string | null
  readonly signal: AbortSignal
  /**
   * Chamado quando o servidor aceitou a foto e a geração entrou na fila, com
   * o tipo de móvel que ele reconheceu nela (null se nenhum do catálogo).
   */
  readonly onAccepted?: (kind: FurnitureKind | null) => void
}

/**
 * Envia a foto (o servidor confere se ela serve), acompanha a fila e devolve
 * a URL do GLB pronto. Lança ApiError com mensagem amigável.
 */
export async function generateModelFromPhoto({
  imageDataUrl,
  challengeToken,
  signal,
  onAccepted,
}: GenerationRequest): Promise<string> {
  const { pollToken, kind } = await callApi(ENDPOINT, {
    body: { image: imageDataUrl, challengeToken, polling: 'bearer' },
    signal,
  }, MESSAGES)
  if (typeof pollToken !== 'string') throw new ApiError(MESSAGES.failed)
  onAccepted?.(toFurnitureKind(kind))
  const deadlineMs = Date.now() + GENERATION_TIMEOUT_MS

  while (Date.now() < deadlineMs) {
    await wait(POLL_INTERVAL_MS, signal)
    const { status, modelUrl } = await callApi(ENDPOINT, {
      headers: { Authorization: `Bearer ${pollToken}` },
      signal,
    }, MESSAGES)
    if (status === 'ready' && typeof modelUrl === 'string') return modelUrl
    if (status !== 'processing') throw new ApiError(MESSAGES.failed)
  }

  throw new ApiError('A geração demorou demais. Tente de novo com outra foto.')
}
