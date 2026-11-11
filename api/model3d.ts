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

/**
 * Foto → modelo 3D. Única rota de servidor do projeto: existe só para
 * guardar a chave do provedor (FAL_KEY) fora do navegador.
 *
 *   POST /api/model3d  { image, challengeToken? }  → { id, kind }
 *   GET  /api/model3d?id=...                        → { status, modelUrl? }
 *
 * A geração leva ~30 s a 1 min, então o POST só enfileira e o navegador consulta.
 *
 * SEGURANÇA — a rota é pública e cada POST custa dinheiro. Camadas, em ordem:
 *   1. mesma origem (barra uso casual por outros sites; não é autenticação)
 *   2. em deploy, recusa rodar sem armazenamento compartilhado e sem anti-robô
 *   3. tamanho, formato e assinatura real da imagem
 *   4. desafio anti-robô verificado no servidor
 *   5. limite de conferências de foto por pessoa
 *   6. conferência da foto pelo Claude (filtro de qualidade, barato; exige ANTHROPIC_API_KEY)
 *   7. limites de geração por pessoa (hora e dia) e teto diário global
 *   8. só se consulta pedido criado por esta rota
 * O teto final é o saldo pré-pago no provedor, sem recarga automática.
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
const PHOTO_CHECK_MAX_TOKENS = 120
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

const unavailable = (): Response => respond(503, null, UNAVAILABLE_MESSAGE)

interface Protections extends RouteGuard {
  readonly maxJobsPerDay: number
}

function readDailyCap(rawValue: string | undefined): number {
  const parsed = Number(rawValue)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_JOBS_PER_DAY
}

/** Configura provedor e proteções; null quando a rota não pode rodar com segurança. */
function resolveProtections(): Protections | null {
  const providerKey = process.env.FAL_KEY
  if (!providerKey) return null

  const guard = resolveRouteGuard('de modelo 3D')
  if (!guard) return null

  fal.config({ credentials: providerKey })
  return { ...guard, maxJobsPerDay: readDailyCap(process.env.MODEL3D_DAILY_LIMIT) }
}

/**
 * Pergunta ao Claude se a foto serve. Sem chave, ou com qualquer falha do
 * verificador (rede, recusa, resposta fora do formato), a foto é aprovada:
 * ele é filtro de qualidade, e a foto ruim custa no máximo uma geração já
 * limitada.
 */
async function checkPhoto(image: string): Promise<PhotoVerdict> {
  if (!isClaudeConfigured()) return { ok: true, kind: null, object: null }
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

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const protections = resolveProtections()
  if (!protections) return unavailable()

  const payload = (await readJsonBody(request, MAX_BODY_LENGTH)) as {
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
    const job = await fal.queue.submit(MODEL_ENDPOINT, {
      input: { image_url: image, prompt: verdict.object ?? FALLBACK_SEGMENT_PROMPT, export_textured_glb: true },
    })
    await store.remember(`job:id:${job.request_id}`, JOB_TTL_S)
    return respond(202, { id: job.request_id, kind: verdict.kind })
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
    const modelUrl = pickModelUrl(result.data)
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
