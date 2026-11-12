/**
 * O que os clientes das rotas do site têm em comum: mandar o pedido e ler o
 * envelope `{ success, data, error }` que toda rota devolve
 * (api/_lib/routeGuard.ts).
 */

/** Erro com mensagem pronta para mostrar ao usuário. */
export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiMessages {
  /** A resposta não veio em JSON: a rota não existe neste ambiente ou caiu. */
  readonly unavailable: string
  /** O servidor recusou sem dizer por quê. */
  readonly failed: string
}

interface ApiRequest {
  /** Corpo em JSON; sem ele, o pedido é um GET. */
  readonly body?: unknown
  readonly headers?: Record<string, string>
  readonly signal: AbortSignal
}

interface ApiEnvelope {
  readonly success?: unknown
  readonly data?: unknown
  readonly error?: unknown
}

const DEFAULT_MESSAGES: ApiMessages = {
  unavailable: 'Este recurso está indisponível no momento.',
  failed: 'Não deu certo. Tente de novo.',
}

/**
 * Chama a rota e devolve o `data` do envelope. Recusa do servidor vira
 * ApiError com a mensagem dele; erro de rede e cancelamento sobem como vieram.
 */
export async function callApi(
  url: string,
  { body, headers, signal }: ApiRequest,
  messages: ApiMessages = DEFAULT_MESSAGES,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, body === undefined ? { headers, signal } : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  })

  let envelope: ApiEnvelope | null
  try {
    envelope = (await response.json()) as ApiEnvelope | null
  } catch {
    throw new ApiError(messages.unavailable)
  }

  const data = envelope?.data
  if (!response.ok || envelope?.success !== true || typeof data !== 'object' || data === null) {
    throw new ApiError(typeof envelope?.error === 'string' ? envelope.error : messages.failed)
  }
  return data as Record<string, unknown>
}
