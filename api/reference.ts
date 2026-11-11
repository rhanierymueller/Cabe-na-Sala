import { askClaudeForJson } from './_lib/claude.js'
import { admitClaudeRequest } from './_lib/claudeRoute.js'
import {
  MAX_IMAGE_DATA_URL_LENGTH,
  imageContentMatchesType,
  isValidImageDataUrl,
} from './_lib/modelRequest.js'
import {
  ROOM_REFERENCE_PROMPT,
  ROOM_REFERENCE_SCHEMA,
  ROOM_REFERENCE_SYSTEM_PROMPT,
  parseRoomReference,
} from './_lib/roomReference.js'
import { respond } from './_lib/routeGuard.js'

/**
 * Foto do cômodo → referência de altura. Devolve onde está a porta (ou a
 * bancada) na foto e quanto ela mede, para a pessoa só confirmar a régua.
 *
 *   POST /api/reference  { image, challengeToken? }  → { kind, bottom, top, heightCm }
 *
 * As proteções da rota ficam em admitClaudeRequest.
 */

const MAX_OUTPUT_TOKENS = 200
const MAX_BODY_LENGTH = MAX_IMAGE_DATA_URL_LENGTH + 4096
/** Apontar um lugar na foto pede mais visão que ler texto; por isso o modelo maior. */
const REFERENCE_MODEL = 'claude-sonnet-5-5'

function parseInput(payload: Record<string, unknown>): string | null {
  const { image } = payload
  return isValidImageDataUrl(image) && imageContentMatchesType(image) ? image : null
}

export async function POST(request: Request): Promise<Response> {
  const admission = await admitClaudeRequest(request, {
    routeName: 'de referência',
    usageKey: 'ref',
    maxPerIpPerHour: 12,
    maxPerDay: 600,
    maxBodyLength: MAX_BODY_LENGTH,
    unavailableMessage: 'A marcação automática está indisponível no momento.',
    invalidMessage: 'Envie uma foto JPG, PNG ou WebP de até 4 MB.',
    limitMessage: 'Muitas fotos em pouco tempo. Marque a altura na mão.',
    parseInput,
  })
  if (admission instanceof Response) return admission

  try {
    const reference = parseRoomReference(
      await askClaudeForJson({
        system: ROOM_REFERENCE_SYSTEM_PROMPT,
        text: ROOM_REFERENCE_PROMPT,
        imageDataUrl: admission.input,
        schema: ROOM_REFERENCE_SCHEMA,
        maxTokens: MAX_OUTPUT_TOKENS,
        model: process.env.CLAUDE_REFERENCE_MODEL || REFERENCE_MODEL,
      }),
    )
    if (!reference) return respond(422, null, 'Não achei uma referência nesta foto.')
    return respond(200, reference)
  } catch (error: unknown) {
    console.error('Falha ao procurar a referência na foto', error)
    return respond(502, null, 'Não foi possível analisar a foto.')
  }
}
