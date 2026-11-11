import { fal } from '@fal-ai/client'
import { isPlausibleChallengeToken, verifyChallenge } from './_lib/challenge.js'
import {
  MAX_IMAGE_DATA_URL_LENGTH,
  clientIpFrom,
  imageContentMatchesType,
  isCrossSiteFetch,
  isSameOrigin,
  isTrustedModelUrl,
  isValidImageDataUrl,
  isValidRequestId,
} from './_lib/modelRequest.js'
import type { PhotoVerdict } from './_lib/photoCheck.js'
import {
  DEFAULT_PHOTO_CHECK_MODEL,
  PHOTO_CHECK_ENDPOINT,
  PHOTO_CHECK_PROMPT,
  PHOTO_CHECK_SYSTEM_PROMPT,
  REJECTION_MESSAGES,
  parseVerdict,
} from './_lib/photoCheck.js'
import type { UsageStore } from './_lib/usageStore.js'
import { resolveStore } from './_lib/usageStore.js'

/**
 * Foto → modelo 3D. Única rota de servidor do projeto: existe só para
 * guardar a chave do provedor (FAL_KEY) fora do navegador.
 *
 *   POST /api/modelo3d  { image, challengeToken? }  → { id }
 *   GET  /api/modelo3d?id=...                        → { status, modelUrl? }
 *
 * A geração leva ~30 s a 1 min, então o POST só enfileira e o navegador consulta.
 *
 * SEGURANÇA — a rota é pública e cada POST custa dinheiro. Camadas, em ordem:
 *   1. mesma origem (barra uso casual por outros sites; não é autenticação)
 *   2. em deploy, recusa rodar sem armazenamento compartilhado e sem anti-robô
 *   3. tamanho, formato e assinatura real da imagem
 *   4. desafio anti-robô verificado no servidor
 *   5. limite de conferências de foto por pessoa
 *   6. conferência da foto por modelo de visão (filtro de qualidade, barato)
 *   7. limites de geração por pessoa (hora e dia) e teto diário global
 *   8. só se consulta pedido criado por esta rota
 * O teto final é o saldo pré-pago no provedor, sem recarga automática.
 */

const MODEL_ENDPOINT = 'fal-ai/trellis'

const HOUR_S = 60 * 60
const DAY_S = 24 * HOUR_S
const MINUTE_S = 60
/** Conferir a foto é barato, mas não gratuito. */
const MAX_CHECKS_PER_IP_PER_HOUR = 12
const PHOTO_CHECK_MAX_TOKENS = 60
const MAX_JOBS_PER_IP_PER_HOUR = 3
const MAX_JOBS_PER_IP_PER_DAY = 8
const DEFAULT_MAX_JOBS_PER_DAY = 100
const MAX_POLLS_PER_IP_PER_MINUTE = 60
/** Por quanto tempo um pedido pode ser consultado depois de criado. */
const JOB_TTL_S = 30 * MINUTE_S
/** Folga sobre a imagem para o restante do JSON (token do desafio, chaves). */
const MAX_BODY_LENGTH = MAX_IMAGE_DATA_URL_LENGTH + 4096

const UNAVAILABLE_MESSAGE = 'A geração por foto está indisponível no momento.'

type JobStatus = 'processing' | 'ready' | 'failed'

interface ApiEnvelope<T> {
  readonly success: boolean
  readonly data: T | null
  readonly error: string | null
}

function respond<T>(status: number, data: T | null, error: string | null = null): Response {
  const body: ApiEnvelope<T> = { success: error === null, data, error }
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

const unavailable = (): Response => respond(503, null, UNAVAILABLE_MESSAGE)

interface Protections {
  readonly store: UsageStore
  /** Segredo do Turnstile; null só no desenvolvimento local. */
  readonly challengeSecret: string | null
  readonly maxJobsPerDay: number
}

function readDailyCap(rawValue: string | undefined): number {
  const parsed = Number(rawValue)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_JOBS_PER_DAY
}

/**
 * Configura provedor e proteções. Devolve null quando a rota não pode rodar
 * com segurança: sem chave, ou — em qualquer deploy na Vercel — sem
 * armazenamento compartilhado ou sem anti-robô. Seguro por padrão.
 */
function resolveProtections(): Protections | null {
  const providerKey = process.env.FAL_KEY
  if (!providerKey) return null

  const { store, isShared } = resolveStore(process.env)
  const challengeSecret = process.env.TURNSTILE_SECRET_KEY || null
  const isDeployed = Boolean(process.env.VERCEL)

  if (isDeployed && (!isShared || !challengeSecret)) {
    console.error(
      'Rota de modelo 3D recusada: em deploy é obrigatório configurar KV_REST_API_URL/' +
        'KV_REST_API_TOKEN (limite de uso) e TURNSTILE_SECRET_KEY (anti-robô).',
    )
    return null
  }

  fal.config({ credentials: providerKey })
  return { store, challengeSecret, maxJobsPerDay: readDailyCap(process.env.MODELO3D_TETO_DIARIO) }
}

/** Lê o corpo com teto de tamanho, sem confiar no Content-Length declarado. */
async function readJsonBody(request: Request): Promise<unknown | null> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_BODY_LENGTH) return null

  const text = await request.text()
  if (text.length > MAX_BODY_LENGTH) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

async function isOverLimit(
  store: UsageStore,
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<boolean> {
  return (await store.increment(key, windowSeconds)) > limit
}

/**
 * Pergunta ao modelo de visão se a foto serve. Qualquer falha do verificador
 * (rede, modelo fora, resposta fora do formato) vira aprovação: ele é filtro
 * de qualidade, e a foto ruim custa no máximo uma geração já limitada.
 */
async function checkPhoto(image: string): Promise<PhotoVerdict> {
  try {
    const result = await fal.subscribe(PHOTO_CHECK_ENDPOINT, {
      input: {
        model: process.env.MODELO3D_MODELO_VISAO || DEFAULT_PHOTO_CHECK_MODEL,
        system_prompt: PHOTO_CHECK_SYSTEM_PROMPT,
        prompt: PHOTO_CHECK_PROMPT,
        image_urls: [image],
        temperature: 0,
        max_tokens: PHOTO_CHECK_MAX_TOKENS,
      },
      logs: false,
    })
    const verdict = parseVerdict((result.data as { output?: unknown } | null)?.output)
    if (verdict) return verdict
    console.error('Conferência da foto devolveu formato inesperado; seguindo sem ela')
  } catch (error: unknown) {
    console.error('Conferência da foto indisponível; seguindo sem ela', error)
  }
  return { ok: true }
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const protections = resolveProtections()
  if (!protections) return unavailable()

  const payload = (await readJsonBody(request)) as {
    image?: unknown
    challengeToken?: unknown
  } | null
  const image = payload?.image
  if (!isValidImageDataUrl(image) || !imageContentMatchesType(image)) {
    return respond(400, null, 'Envie uma foto JPG, PNG ou WebP de até 4 MB.')
  }

  const clientIp = clientIpFrom(request.headers)
  const { store, challengeSecret, maxJobsPerDay } = protections

  if (challengeSecret) {
    const token = payload?.challengeToken
    const passed =
      isPlausibleChallengeToken(token) && (await verifyChallenge(token, challengeSecret, clientIp))
    if (!passed) return respond(403, null, 'Não foi possível confirmar que você não é um robô.')
  }

  try {
    if (await isOverLimit(store, `check:ip:hour:${clientIp}`, HOUR_S, MAX_CHECKS_PER_IP_PER_HOUR)) {
      return respond(429, null, 'Muitas tentativas. Tente de novo mais tarde.')
    }
  } catch (error: unknown) {
    console.error('Falha no controle de uso da rota de modelo 3D', error)
    return unavailable()
  }

  const verdict = await checkPhoto(image)
  if (!verdict.ok) return respond(422, null, REJECTION_MESSAGES[verdict.reason])

  try {
    if (
      (await isOverLimit(store, `job:ip:hour:${clientIp}`, HOUR_S, MAX_JOBS_PER_IP_PER_HOUR)) ||
      (await isOverLimit(store, `job:ip:day:${clientIp}`, DAY_S, MAX_JOBS_PER_IP_PER_DAY))
    ) {
      return respond(429, null, 'Você já gerou vários modelos. Tente de novo mais tarde.')
    }
    if (await isOverLimit(store, 'job:global:day', DAY_S, maxJobsPerDay)) {
      return respond(429, null, 'O limite de modelos de hoje foi atingido. Volte amanhã.')
    }
  } catch (error: unknown) {
    // Sem conseguir contar, não gastamos: falha fechada.
    console.error('Falha no controle de uso da rota de modelo 3D', error)
    return unavailable()
  }

  try {
    const job = await fal.queue.submit(MODEL_ENDPOINT, { input: { image_url: image } })
    await store.remember(`job:id:${job.request_id}`, JOB_TTL_S)
    return respond(202, { id: job.request_id })
  } catch (error: unknown) {
    console.error('Falha ao enfileirar a geração do modelo 3D', error)
    return respond(502, null, 'Não foi possível iniciar a geração. Tente de novo.')
  }
}

export async function GET(request: Request): Promise<Response> {
  if (isCrossSiteFetch(request.headers.get('sec-fetch-site'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const protections = resolveProtections()
  if (!protections) return unavailable()

  const id = new URL(request.url).searchParams.get('id')
  if (!isValidRequestId(id)) return respond(400, null, 'Identificador inválido.')

  const { store } = protections
  try {
    const clientIp = clientIpFrom(request.headers)
    if (await isOverLimit(store, `poll:ip:${clientIp}`, MINUTE_S, MAX_POLLS_PER_IP_PER_MINUTE)) {
      return respond(429, null, 'Muitas consultas. Aguarde um instante.')
    }
    // Só consultamos pedidos criados aqui: a chave não vira leitor genérico do provedor.
    if (!(await store.has(`job:id:${id}`))) return respond(404, null, 'Pedido não encontrado.')
  } catch (error: unknown) {
    console.error('Falha no controle de uso da rota de modelo 3D', error)
    return unavailable()
  }

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
