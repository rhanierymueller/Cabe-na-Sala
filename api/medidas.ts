import {
  AD_MEASURES_PROMPT,
  AD_MEASURES_SCHEMA,
  AD_MEASURES_SYSTEM_PROMPT,
  isValidAdText,
  parseAdMeasures,
} from './_lib/adMeasures.js'
import { isPlausibleChallengeToken, verifyChallenge } from './_lib/challenge.js'
import { askClaudeForJson, isClaudeConfigured } from './_lib/claude.js'
import {
  MAX_IMAGE_DATA_URL_LENGTH,
  clientIpFrom,
  imageContentMatchesType,
  isSameOrigin,
  isValidImageDataUrl,
} from './_lib/modelRequest.js'
import { isOverLimit, readJsonBody, resolveRouteGuard, respond } from './_lib/routeGuard.js'

/**
 * Anúncio → medidas. Recebe o texto colado ou um print do anúncio e devolve
 * largura, altura e profundidade em centímetros.
 *
 *   POST /api/medidas  { text?, image?, challengeToken? }  → { widthCm, heightCm, depthCm }
 *
 * Rota pública e paga (pouco): mesma origem → recusa em deploy sem Redis e
 * Turnstile → validação da entrada → anti-robô → limites por pessoa e global.
 */

const HOUR_S = 60 * 60
const DAY_S = 24 * HOUR_S
const MAX_READS_PER_IP_PER_HOUR = 15
const MAX_READS_PER_DAY = 1000
const MAX_OUTPUT_TOKENS = 200
/** Folga sobre a imagem para o texto do anúncio e o restante do JSON. */
const MAX_BODY_LENGTH = MAX_IMAGE_DATA_URL_LENGTH + 16_384

const UNAVAILABLE_MESSAGE = 'A leitura do anúncio está indisponível no momento.'

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const guard = isClaudeConfigured() ? resolveRouteGuard('de medidas') : null
  if (!guard) return respond(503, null, UNAVAILABLE_MESSAGE)

  const payload = (await readJsonBody(request, MAX_BODY_LENGTH)) as {
    text?: unknown
    image?: unknown
    challengeToken?: unknown
  } | null
  const text = payload?.text
  const image = payload?.image
  const hasText = isValidAdText(text)
  const hasImage = isValidImageDataUrl(image) && imageContentMatchesType(image)
  if ((text !== undefined && !hasText) || (image !== undefined && !hasImage) || (!hasText && !hasImage)) {
    return respond(400, null, 'Cole o texto do anúncio ou envie um print em JPG, PNG ou WebP.')
  }

  const clientIp = clientIpFrom(request.headers)
  if (guard.challengeSecret) {
    const token = payload?.challengeToken
    const passed =
      isPlausibleChallengeToken(token) &&
      (await verifyChallenge(token, guard.challengeSecret, clientIp))
    if (!passed) return respond(403, null, 'Não foi possível confirmar que você não é um robô.')
  }

  try {
    if (
      (await isOverLimit(guard.store, `ad:ip:hour:${clientIp}`, HOUR_S, MAX_READS_PER_IP_PER_HOUR)) ||
      (await isOverLimit(guard.store, 'ad:global:day', DAY_S, MAX_READS_PER_DAY))
    ) {
      return respond(429, null, 'Muitas leituras. Digite as medidas ou tente de novo mais tarde.')
    }
  } catch (error: unknown) {
    // Sem conseguir contar, não gastamos: falha fechada.
    console.error('Falha no controle de uso da rota de medidas', error)
    return respond(503, null, UNAVAILABLE_MESSAGE)
  }

  try {
    const measures = parseAdMeasures(
      await askClaudeForJson({
        system: AD_MEASURES_SYSTEM_PROMPT,
        text: hasText ? `${AD_MEASURES_PROMPT}\n\n<anuncio>\n${text}\n</anuncio>` : AD_MEASURES_PROMPT,
        imageDataUrl: hasImage ? image : undefined,
        schema: AD_MEASURES_SCHEMA,
        maxTokens: MAX_OUTPUT_TOKENS,
      }),
    )
    if (!measures) return respond(422, null, 'Não encontrei medidas neste anúncio. Digite-as acima.')
    return respond(200, measures)
  } catch (error: unknown) {
    console.error('Falha ao ler as medidas do anúncio', error)
    return respond(502, null, 'Não foi possível ler o anúncio. Tente de novo.')
  }
}
