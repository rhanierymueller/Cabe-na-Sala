import { isPlausibleChallengeToken, verifyChallenge } from './challenge.js'
import { isClaudeConfigured } from './claude.js'
import { clientIpFrom, isSameOrigin } from './modelRequest.js'
import { isOverLimit, readJsonBody, resolveRouteGuard, respond } from './routeGuard.js'

/**
 * Porta de entrada comum das rotas que chamam o Claude. Rota pública e paga
 * (pouco): mesma origem → recusa em deploy sem Redis e Turnstile → validação
 * da entrada → anti-robô → limites por pessoa e global. Só quem passa por
 * tudo isso chega a gastar.
 */

const HOUR_S = 60 * 60
const DAY_S = 24 * HOUR_S

interface ClaudeRouteOptions<T> {
  /** Nome para o log, no formato "de medidas". */
  readonly routeName: string
  /** Prefixo das chaves de contagem de uso. */
  readonly usageKey: string
  readonly maxPerIpPerHour: number
  readonly maxPerDay: number
  readonly maxBodyLength: number
  readonly unavailableMessage: string
  readonly invalidMessage: string
  readonly limitMessage: string
  /** Valida o corpo; null quando a entrada não serve. */
  readonly parseInput: (payload: Record<string, unknown>) => T | null
}

/** Devolve a entrada validada ou a resposta de recusa pronta. */
export async function admitClaudeRequest<T>(
  request: Request,
  options: ClaudeRouteOptions<T>,
): Promise<{ readonly input: T } | Response> {
  if (!isSameOrigin(request.headers.get('origin'), request.headers.get('host'))) {
    return respond(403, null, 'Origem não permitida.')
  }
  const guard = isClaudeConfigured() ? resolveRouteGuard(options.routeName) : null
  if (!guard) return respond(503, null, options.unavailableMessage)

  const payload = await readJsonBody(request, options.maxBodyLength)
  const input =
    typeof payload === 'object' && payload !== null
      ? options.parseInput(payload as Record<string, unknown>)
      : null
  if (input === null) return respond(400, null, options.invalidMessage)

  const clientIp = clientIpFrom(request.headers)
  if (guard.challengeSecret) {
    const token = (payload as { challengeToken?: unknown }).challengeToken
    const passed =
      isPlausibleChallengeToken(token) &&
      (await verifyChallenge(token, guard.challengeSecret, clientIp))
    if (!passed) return respond(403, null, 'Não foi possível confirmar que você não é um robô.')
  }

  try {
    const { store } = guard
    const ipKey = `${options.usageKey}:ip:hour:${clientIp}`
    if (
      (await isOverLimit(store, ipKey, HOUR_S, options.maxPerIpPerHour)) ||
      (await isOverLimit(store, `${options.usageKey}:global:day`, DAY_S, options.maxPerDay))
    ) {
      return respond(429, null, options.limitMessage)
    }
  } catch (error: unknown) {
    // Sem conseguir contar, não gastamos: falha fechada.
    console.error(`Falha no controle de uso da rota ${options.routeName}`, error)
    return respond(503, null, options.unavailableMessage)
  }

  return { input }
}
