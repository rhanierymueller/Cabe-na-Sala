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

type JobState =
  | { readonly status: 'processing' }
  | { readonly status: 'failed' }
  | { readonly status: 'ready'; readonly modelUrl: string }

async function startJob(
  imageDataUrl: string,
  challengeToken: string | null,
  signal: AbortSignal,
): Promise<{ readonly id: string; readonly kind: FurnitureKind | null }> {
  const data = await callApi(ENDPOINT, { body: { image: imageDataUrl, challengeToken }, signal }, MESSAGES)
  if (typeof data.id !== 'string') throw new ApiError(MESSAGES.failed)
  return { id: data.id, kind: toFurnitureKind(data.kind) }
}

async function checkJob(id: string, signal: AbortSignal): Promise<JobState> {
  const data = await callApi(`${ENDPOINT}?id=${encodeURIComponent(id)}`, { signal }, MESSAGES)

  if (data.status === 'ready' && typeof data.modelUrl === 'string') {
    return { status: 'ready', modelUrl: data.modelUrl }
  }
  if (data.status === 'processing') return { status: 'processing' }
  return { status: 'failed' }
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
  const { id, kind } = await startJob(imageDataUrl, challengeToken, signal)
  onAccepted?.(kind)
  const deadlineMs = Date.now() + GENERATION_TIMEOUT_MS

  while (Date.now() < deadlineMs) {
    await wait(POLL_INTERVAL_MS, signal)
    const job = await checkJob(id, signal)
    if (job.status === 'ready') return job.modelUrl
    if (job.status === 'failed') throw new ApiError(MESSAGES.failed)
  }

  throw new ApiError('A geração demorou demais. Tente de novo com outra foto.')
}
