import Anthropic from '@anthropic-ai/sdk'
import { splitImageDataUrl } from './modelRequest.js'

/**
 * Acesso ao Claude para as tarefas de "entender" (conferir foto, ler medidas).
 * Modelo pequeno, sem raciocínio e com resposta em JSON de formato fixo:
 * são classificações e extrações curtas em rota pública.
 */

const DEFAULT_MODEL = 'claude-haiku-5-5'
const REQUEST_TIMEOUT_MS = 20_000

export interface ClaudeJsonRequest {
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
  const response = await client.messages.create({
    model: process.env.CLAUDE_MODELO || DEFAULT_MODEL,
    max_tokens: request.maxTokens,
    thinking: { type: 'disabled' },
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
