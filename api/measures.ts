import {
  AD_MEASURES_PROMPT,
  AD_MEASURES_SCHEMA,
  AD_MEASURES_SYSTEM_PROMPT,
  isValidAdText,
  parseAdMeasures,
} from './_lib/adMeasures.js'
import { askClaudeForJson } from './_lib/claude.js'
import { admitClaudeRequest } from './_lib/claudeRoute.js'
import {
  MAX_IMAGE_DATA_URL_LENGTH,
  imageContentMatchesType,
  isValidImageDataUrl,
} from './_lib/modelRequest.js'
import { respond } from './_lib/routeGuard.js'

/**
 * Anúncio → medidas. Recebe o texto colado ou um print do anúncio e devolve
 * largura, altura e profundidade em centímetros, mais o tipo de móvel.
 *
 *   POST /api/measures  { text?, image?, challengeToken? }  → { widthCm, heightCm, depthCm, kind }
 *
 * As proteções da rota ficam em admitClaudeRequest.
 */

const MAX_OUTPUT_TOKENS = 200
/** Folga sobre a imagem para o texto do anúncio e o restante do JSON. */
const MAX_BODY_LENGTH = MAX_IMAGE_DATA_URL_LENGTH + 16_384

interface AdInput {
  readonly text: string | null
  readonly image: string | null
}

/** Aceita texto, print ou os dois; qualquer campo presente tem de ser válido. */
function parseInput(payload: Record<string, unknown>): AdInput | null {
  const { text, image } = payload
  const hasText = isValidAdText(text)
  const hasImage = isValidImageDataUrl(image) && imageContentMatchesType(image)
  if ((text !== undefined && !hasText) || (image !== undefined && !hasImage)) return null
  if (!hasText && !hasImage) return null
  return { text: hasText ? text : null, image: hasImage ? image : null }
}

export async function POST(request: Request, localDevelopment: true | undefined = undefined): Promise<Response> {
  const admission = await admitClaudeRequest(request, {
    routeName: 'de medidas',
    usageKey: 'ad',
    maxPerIpPerHour: 15,
    maxPerDay: 1000,
    maxBodyLength: MAX_BODY_LENGTH,
    unavailableMessage: 'A leitura do anúncio está indisponível no momento.',
    invalidMessage: 'Cole o texto do anúncio ou envie um print em JPG, PNG ou WebP.',
    limitMessage: 'Muitas leituras. Digite as medidas ou tente de novo mais tarde.',
    parseInput,
  }, localDevelopment)
  if (admission instanceof Response) return admission
  const { text, image } = admission.input

  try {
    const measures = parseAdMeasures(
      await askClaudeForJson({
        system: AD_MEASURES_SYSTEM_PROMPT,
        text: text
          ? `${AD_MEASURES_PROMPT}\n\n<anuncio>\n${text}\n</anuncio>`
          : AD_MEASURES_PROMPT,
        imageDataUrl: image ?? undefined,
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
