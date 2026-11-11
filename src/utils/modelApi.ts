/**
 * Cliente da rota de servidor que transforma foto em modelo 3D.
 * O navegador nunca fala com o provedor: só com /api/modelo3d.
 */

const ENDPOINT = '/api/modelo3d'
const POLL_INTERVAL_MS = 3000
/** A geração costuma levar ~1 min; depois disso desistimos com mensagem clara. */
const GENERATION_TIMEOUT_MS = 4 * 60 * 1000
const GENERIC_ERROR_MESSAGE = 'Não foi possível gerar o modelo. Tente de novo.'

/** Erro com mensagem pronta para mostrar ao usuário. */
export class ModelApiError extends Error {
  constructor(message: string = GENERIC_ERROR_MESSAGE) {
    super(message)
    this.name = 'ModelApiError'
  }
}

interface ApiEnvelope {
  readonly success?: unknown
  readonly data?: unknown
  readonly error?: unknown
}

type JobState =
  | { readonly status: 'processing' }
  | { readonly status: 'failed' }
  | { readonly status: 'ready'; readonly modelUrl: string }

async function readEnvelope(response: Response): Promise<ApiEnvelope> {
  try {
    return (await response.json()) as ApiEnvelope
  } catch {
    // Resposta sem JSON: a rota não existe neste ambiente ou caiu.
    throw new ModelApiError('A geração por foto está indisponível no momento.')
  }
}

function unwrap(response: Response, envelope: ApiEnvelope): Record<string, unknown> {
  if (!response.ok || envelope.success !== true || typeof envelope.data !== 'object' || !envelope.data) {
    throw new ModelApiError(typeof envelope.error === 'string' ? envelope.error : undefined)
  }
  return envelope.data as Record<string, unknown>
}

async function startJob(
  imageDataUrl: string,
  challengeToken: string | null,
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl, challengeToken }),
    signal,
  })
  const data = unwrap(response, await readEnvelope(response))
  if (typeof data.id !== 'string') throw new ModelApiError()
  return data.id
}

async function checkJob(id: string, signal: AbortSignal): Promise<JobState> {
  const response = await fetch(`${ENDPOINT}?id=${encodeURIComponent(id)}`, { signal })
  const data = unwrap(response, await readEnvelope(response))

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

export interface GenerationRequest {
  readonly imageDataUrl: string
  /** Token do desafio anti-robô; null quando o ambiente não usa desafio. */
  readonly challengeToken: string | null
  readonly signal: AbortSignal
  /** Chamado quando o servidor aceitou a foto e a geração entrou na fila. */
  readonly onAccepted?: () => void
}

/**
 * Envia a foto (o servidor confere se ela serve), acompanha a fila e devolve
 * a URL do GLB pronto. Lança ModelApiError com mensagem amigável.
 */
export async function generateModelFromPhoto({
  imageDataUrl,
  challengeToken,
  signal,
  onAccepted,
}: GenerationRequest): Promise<string> {
  const id = await startJob(imageDataUrl, challengeToken, signal)
  onAccepted?.()
  const deadlineMs = Date.now() + GENERATION_TIMEOUT_MS

  while (Date.now() < deadlineMs) {
    await wait(POLL_INTERVAL_MS, signal)
    const job = await checkJob(id, signal)
    if (job.status === 'ready') return job.modelUrl
    if (job.status === 'failed') throw new ModelApiError()
  }

  throw new ModelApiError('A geração demorou demais. Tente de novo com outra foto.')
}
