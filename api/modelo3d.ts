import { fal } from '@fal-ai/client'
import {
  clientIpFrom,
  createRateLimiter,
  isSameOrigin,
  isTrustedModelUrl,
  isValidImageDataUrl,
  isValidRequestId,
} from './_lib/modelRequest.js'

/**
 * Foto → modelo 3D. Única rota de servidor do projeto: existe só para
 * guardar a chave do provedor (FAL_KEY) fora do navegador.
 *
 *   POST /api/modelo3d  { image: dataUrl }  → { id }
 *   GET  /api/modelo3d?id=...                → { status, modelUrl? }
 *
 * A geração leva ~1 min, então o POST só enfileira e o navegador consulta.
 */

const MODEL_ENDPOINT = 'fal-ai/trellis'
const ONE_HOUR_MS = 60 * 60 * 1000
/** Cada geração custa dinheiro: poucas por pessoa, teto por instância. */
const MAX_JOBS_PER_IP_PER_HOUR = 3
const MAX_JOBS_PER_INSTANCE_PER_HOUR = 40
const GLOBAL_LIMIT_KEY = 'global'

const perIpLimiter = createRateLimiter(MAX_JOBS_PER_IP_PER_HOUR, ONE_HOUR_MS)
const globalLimiter = createRateLimiter(MAX_JOBS_PER_INSTANCE_PER_HOUR, ONE_HOUR_MS)

type JobStatus = 'processing' | 'ready' | 'failed'

interface ApiEnvelope<T> {
  readonly success: boolean
  readonly data: T | null
  readonly error: string | null
}

function respond<T>(status: number, data: T | null, error: string | null = null): Response {
  const body: ApiEnvelope<T> = { success: error === null, data, error }
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Configura o cliente; devolve false quando a chave não está definida. */
function configureProvider(): boolean {
  const key = process.env.FAL_KEY
  if (!key) return false
  fal.config({ credentials: key })
  return true
}

const UNAVAILABLE_MESSAGE = 'A geração por foto está indisponível no momento.'

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  if (!configureProvider()) return respond(503, null, UNAVAILABLE_MESSAGE)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return respond(400, null, 'Corpo da requisição inválido.')
  }

  const image = (payload as { image?: unknown } | null)?.image
  if (!isValidImageDataUrl(image)) {
    return respond(400, null, 'Envie uma foto JPG, PNG ou WebP de até 4 MB.')
  }

  const nowMs = Date.now()
  const clientIp = clientIpFrom(request.headers.get('x-forwarded-for'))
  if (!perIpLimiter.tryConsume(clientIp, nowMs)) {
    return respond(429, null, 'Você já gerou vários modelos. Tente de novo em uma hora.')
  }
  if (!globalLimiter.tryConsume(GLOBAL_LIMIT_KEY, nowMs)) {
    return respond(429, null, 'Muita gente gerando modelos agora. Tente de novo em instantes.')
  }

  try {
    const job = await fal.queue.submit(MODEL_ENDPOINT, { input: { image_url: image } })
    return respond(202, { id: job.request_id })
  } catch (error: unknown) {
    console.error('Falha ao enfileirar a geração do modelo 3D', error)
    return respond(502, null, 'Não foi possível iniciar a geração. Tente de novo.')
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!configureProvider()) return respond(503, null, UNAVAILABLE_MESSAGE)

  const id = new URL(request.url).searchParams.get('id')
  if (!isValidRequestId(id)) return respond(400, null, 'Identificador inválido.')

  try {
    const job = await fal.queue.status(MODEL_ENDPOINT, { requestId: id, logs: false })
    if (job.status !== 'COMPLETED') {
      return respond<{ status: JobStatus }>(200, { status: 'processing' })
    }

    const result = await fal.queue.result(MODEL_ENDPOINT, { requestId: id })
    const modelUrl = (result.data as { model_mesh?: { url?: unknown } } | null)?.model_mesh?.url
    if (!isTrustedModelUrl(modelUrl)) {
      console.error('Resultado do provedor sem URL de modelo confiável', { id })
      return respond<{ status: JobStatus }>(200, { status: 'failed' })
    }
    return respond(200, { status: 'ready' as JobStatus, modelUrl })
  } catch (error: unknown) {
    console.error('Falha ao consultar a geração do modelo 3D', { id, error })
    return respond<{ status: JobStatus }>(200, { status: 'failed' })
  }
}
