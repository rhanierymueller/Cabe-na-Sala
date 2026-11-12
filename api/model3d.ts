import { createHash, randomBytes } from 'node:crypto'
import { fal } from '@fal-ai/client'
import { isPlausibleChallengeToken, verifyChallenge } from './_lib/challenge.js'
import { askClaudeForJson, isClaudeConfigured } from './_lib/claude.js'
import {
  MAX_IMAGE_DATA_URL_LENGTH,
  clientIpFrom,
  imageContentMatchesType,
  isCrossSiteFetch,
  isSameOrigin,
  isTrustedModelUrl,
  isValidImageDataUrl,
  isValidRequestId,
  pickModelUrl,
} from './_lib/modelRequest.js'
import type { PhotoVerdict } from './_lib/photoCheck.js'
import {
  PHOTO_CHECK_PROMPT,
  PHOTO_CHECK_SCHEMA,
  PHOTO_CHECK_SYSTEM_PROMPT,
  REJECTION_MESSAGES,
  parseVerdict,
} from './_lib/photoCheck.js'
import type { RouteGuard } from './_lib/routeGuard.js'
import { isOverLimit, readJsonBody, resolveRouteGuard, respond } from './_lib/routeGuard.js'
import { windowKey } from './_lib/usageStore.js'

/**
 * POST enfileira a geração e devolve uma credencial temporária de consulta.
 * GET usa essa credencial no cabeçalho Authorization; o ID do provedor fica no servidor.
 */

/** SAM 3D (Meta): recorta o móvel da foto pelo nome e reconstrói só ele, sem o fundo. */
const MODEL_ENDPOINT = 'fal-ai/sam-3/3d-objects'
/** Sem o nome que a conferência do Claude dá, o recorte procura qualquer móvel. */
const FALLBACK_SEGMENT_PROMPT = 'furniture'

const HOUR_S = 60 * 60
const DAY_S = 24 * HOUR_S
const MINUTE_S = 60
/** Conferir a foto é barato, mas não gratuito. */
const MAX_CHECKS_PER_IP_PER_HOUR = 12
const MAX_CHECKS_PER_DAY = 300
const PHOTO_CHECK_MAX_TOKENS = 120
const MAX_JOBS_PER_IP_PER_HOUR = 3
const MAX_JOBS_PER_IP_PER_DAY = 8
const DEFAULT_MAX_JOBS_PER_DAY = 100
const GLOBAL_JOB_COUNT_KEY = 'job:global:day'
const MAX_POLLS_PER_IP_PER_MINUTE = 60
/** Por quanto tempo um pedido pode ser consultado depois de criado. */
const JOB_TTL_S = 30 * MINUTE_S
const POLL_AUTH_PATTERN = /^Bearer ([A-Za-z0-9_-]{43})$/i
/** Folga sobre a imagem para o restante do JSON (token do desafio, chaves). */
const MAX_BODY_LENGTH = MAX_IMAGE_DATA_URL_LENGTH + 4096

const UNAVAILABLE_MESSAGE = 'A geração por foto está indisponível no momento.'
const DAILY_LIMIT_MESSAGE = 'O limite de modelos de hoje foi atingido. Volte amanhã.'

const unavailable = (): Response => respond(503, null, UNAVAILABLE_MESSAGE)

interface Protections extends RouteGuard {
  readonly maxJobsPerDay: number
}

function readDailyCap(rawValue: string | undefined): number {
  const parsed = Number(rawValue)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_JOBS_PER_DAY
}

function pollKey(token: string): string {
  return 'job:poll:' + createHash('sha256').update(token).digest('hex')
}

/** Configura provedor e proteções; null quando a rota não pode rodar com segurança. */
function resolveProtections(localDevelopment?: true): Protections | null {
  const providerKey = process.env.FAL_KEY
  if (!providerKey) return null

  const guard = resolveRouteGuard('de modelo 3D', localDevelopment)
  if (!guard) return null

  fal.config({ credentials: providerKey })
  return { ...guard, maxJobsPerDay: readDailyCap(process.env.MODEL3D_DAILY_LIMIT) }
}

/**
 * Pergunta ao Claude se a foto serve. Com qualquer falha do
 * verificador (rede, recusa, resposta fora do formato), a foto é aprovada:
 * ele é filtro de qualidade, e a foto ruim custa no máximo uma geração já
 * limitada.
 */
async function checkPhoto(image: string): Promise<PhotoVerdict> {
  try {
    const verdict = parseVerdict(
      await askClaudeForJson({
        system: PHOTO_CHECK_SYSTEM_PROMPT,
        text: PHOTO_CHECK_PROMPT,
        imageDataUrl: image,
        schema: PHOTO_CHECK_SCHEMA,
        maxTokens: PHOTO_CHECK_MAX_TOKENS,
      }),
    )
    if (verdict) return verdict
    console.error('Conferência da foto devolveu formato inesperado; seguindo sem ela')
  } catch (error: unknown) {
    console.error('Conferência da foto indisponível; seguindo sem ela', error)
  }
  return { ok: true, kind: null, object: null }
}

export async function POST(request: Request, localDevelopment: true | undefined = undefined): Promise<Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const protections = resolveProtections(localDevelopment)
  if (!protections) return unavailable()

  const payload = (await readJsonBody(request, MAX_BODY_LENGTH)) as {
    image?: unknown
    challengeToken?: unknown
    polling?: unknown
  } | null
  const image = payload?.image
  if (!isValidImageDataUrl(image) || !imageContentMatchesType(image)) {
    return respond(400, null, 'Envie uma foto JPG, PNG ou WebP de até 4 MB.')
  }
  // Uma aba antiga não consegue consultar com a credencial nova. Recusa antes de gastar.
  if (payload?.polling !== 'bearer') {
    return respond(409, null, 'Recarregue a página para gerar o modelo.')
  }

  const clientIp = clientIpFrom(request.headers)
  const { store, challengeSecret, maxJobsPerDay } = protections

  if (challengeSecret) {
    const token = payload?.challengeToken
    const passed =
      isPlausibleChallengeToken(token) && (await verifyChallenge(token, challengeSecret, clientIp))
    if (!passed) return respond(403, null, 'Não foi possível confirmar que você não é um robô.')
  }

  let verdict: PhotoVerdict = { ok: true, kind: null, object: null }
  try {
    if (isClaudeConfigured()) {
      const dailyJobs = Number(await store.get(windowKey(GLOBAL_JOB_COUNT_KEY, DAY_S, Date.now())) ?? 0)
      if (!Number.isSafeInteger(dailyJobs) || dailyJobs < 0) throw new Error('Redis: contador inválido')
      if (dailyJobs >= maxJobsPerDay) return respond(429, null, DAILY_LIMIT_MESSAGE)
      if (
        (await isOverLimit(store, `check:ip:hour:${clientIp}`, HOUR_S, MAX_CHECKS_PER_IP_PER_HOUR)) ||
        (await isOverLimit(store, 'check:global:day', DAY_S, MAX_CHECKS_PER_DAY))
      ) {
        return respond(429, null, 'Limite de análises de foto atingido. Tente novamente mais tarde.')
      }
      verdict = await checkPhoto(image)
      if (!verdict.ok) return respond(422, null, REJECTION_MESSAGES[verdict.reason])
    }

    if (
      (await isOverLimit(store, `job:ip:hour:${clientIp}`, HOUR_S, MAX_JOBS_PER_IP_PER_HOUR)) ||
      (await isOverLimit(store, `job:ip:day:${clientIp}`, DAY_S, MAX_JOBS_PER_IP_PER_DAY))
    ) {
      return respond(429, null, 'Você já gerou vários modelos. Tente de novo mais tarde.')
    }
    if (await isOverLimit(store, GLOBAL_JOB_COUNT_KEY, DAY_S, maxJobsPerDay)) {
      return respond(429, null, DAILY_LIMIT_MESSAGE)
    }
  } catch (error: unknown) {
    // Sem conseguir contar, não gastamos: falha fechada.
    console.error('Falha no controle de uso da rota de modelo 3D', error)
    return unavailable()
  }

  try {
    const pollToken = randomBytes(32).toString('base64url')
    const job = await fal.queue.submit(MODEL_ENDPOINT, {
      input: { image_url: image, prompt: verdict.object ?? FALLBACK_SEGMENT_PROMPT, export_textured_glb: true },
    })
    await store.set(pollKey(pollToken), job.request_id, JOB_TTL_S)
    return respond(202, { pollToken, kind: verdict.kind })
  } catch (error: unknown) {
    console.error('Falha ao enfileirar a geração do modelo 3D', error)
    return respond(502, null, 'Não foi possível iniciar a geração. Tente de novo.')
  }
}

export async function GET(request: Request, localDevelopment: true | undefined = undefined): Promise<Response> {
  if (isCrossSiteFetch(request.headers.get('sec-fetch-site'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const protections = resolveProtections(localDevelopment)
  if (!protections) return unavailable()

  const token = POLL_AUTH_PATTERN.exec(request.headers.get('authorization') ?? '')?.[1]
  if (!token) return respond(401, null, 'Credencial de consulta inválida.')

  const key = pollKey(token)
  const { store } = protections
  let id: string
  try {
    const clientIp = clientIpFrom(request.headers)
    if (await isOverLimit(store, `poll:ip:${clientIp}`, MINUTE_S, MAX_POLLS_PER_IP_PER_MINUTE)) {
      return respond(429, null, 'Muitas consultas. Aguarde um instante.')
    }
    const saved = await store.get(key)
    if (isTrustedModelUrl(saved)) return respond(200, { status: 'ready', modelUrl: saved })
    if (!isValidRequestId(saved)) return respond(404, null, 'Pedido não encontrado.')
    id = saved
  } catch (error: unknown) {
    console.error('Falha no controle de uso da rota de modelo 3D', error)
    return unavailable()
  }

  try {
    const job = await fal.queue.status(MODEL_ENDPOINT, { requestId: id, logs: false })
    if (job.status !== 'COMPLETED') {
      return respond(200, { status: 'processing' })
    }

    const result = await fal.queue.result(MODEL_ENDPOINT, { requestId: id })
    const modelUrl = pickModelUrl(result.data)
    if (!isTrustedModelUrl(modelUrl)) {
      throw new Error('Resultado do provedor sem URL de modelo confiável')
    }
    // O modelo já está pronto: sem o cache, a próxima consulta só pergunta à fal de novo.
    await store.set(key, modelUrl, JOB_TTL_S).catch((error: unknown) => {
      console.error('Falha ao guardar o modelo pronto no cache', { id, error })
    })
    return respond(200, { status: 'ready', modelUrl })
  } catch (error: unknown) {
    console.error('Falha ao consultar a geração do modelo 3D', { id, error })
    return respond(200, { status: 'failed' })
  }
}
