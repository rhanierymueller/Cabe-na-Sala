import Anthropic from '@anthropic-ai/sdk'
import { splitImageDataUrl } from './modelRequest.js'

/**
 * Acesso ao Claude para as tarefas de "entender" (conferir foto, ler medidas).
 * Por padrão, modelo pequeno e sem raciocínio, com resposta em JSON de formato
 * fixo: são classificações e extrações curtas em rota pública.
 */

const DEFAULT_MODEL = 'claude-haiku-5-5'
const REQUEST_TIMEOUT_MS = 20_000
/** Só o modelo pequeno aceita desligar o raciocínio; nos maiores ele é obrigatório. */
const SMALL_MODEL_PREFIX = 'claude-haiku'
/** O raciocínio dos modelos maiores conta no teto de saída: sem folga, a resposta sai cortada. */
const THINKING_HEADROOM_TOKENS = 2000

interface ClaudeJsonRequest {
  readonly system: string
  readonly text: string
  /** Imagem como data URL já validada (JPG, PNG ou WebP). */
  readonly imageDataUrl?: string
  /** JSON Schema da resposta. */
  readonly schema: Record<string, unknown>
  readonly maxTokens: number
}

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

function buildContent(request: ClaudeJsonRequest): Anthropic.ContentBlockParam[] {
  const textBlock: Anthropic.TextBlockParam = { type: 'text', text: request.text }
  const image = request.imageDataUrl ? splitImageDataUrl(request.imageDataUrl) : null
  if (!image) return [textBlock]

  return [
    { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
    textBlock,
  ]
}

/**
 * Pergunta ao Claude e devolve o JSON da resposta, ainda sem validar.
 * Devolve null quando o modelo recusou ou a resposta veio cortada.
 * Erros de rede e da API sobem para o chamador decidir.
 */
export async function askClaudeForJson(request: ClaudeJsonRequest): Promise<unknown | null> {
  const client = new Anthropic({ timeout: REQUEST_TIMEOUT_MS, maxRetries: 1 })
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL
  const isSmallModel = model.startsWith(SMALL_MODEL_PREFIX)
  const response = await client.messages.create({
    model,
    max_tokens: isSmallModel ? request.maxTokens : request.maxTokens + THINKING_HEADROOM_TOKENS,
    ...(isSmallModel ? { thinking: { type: 'disabled' as const } } : {}),
    output_config: { effort: 'low', format: { type: 'json_schema', schema: request.schema } },
    system: request.system,
    messages: [{ role: 'user', content: buildContent(request) }],
  })

  if (response.stop_reason !== 'end_turn') return null
  const text = response.content.find((block) => block.type === 'text')?.text
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}
