import type { UsageStore } from './usageStore.js'
import { resolveStore } from './usageStore.js'

/**
 * O que toda rota paga tem em comum: envelope de resposta, leitura do corpo
 * com teto, contagem de uso e a recusa de rodar em deploy sem proteção.
 */

interface ApiEnvelope<T> {
  readonly success: boolean
  readonly data: T | null
  readonly error: string | null
}

export function respond<T>(status: number, data: T | null, error: string | null = null): Response {
  const body: ApiEnvelope<T> = { success: error === null, data, error }
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}

export interface RouteGuard {
  readonly store: UsageStore
  /** Segredo do Turnstile; null só no desenvolvimento local. */
  readonly challengeSecret: string | null
}

/**
 * As rotas públicas exigem armazenamento compartilhado e anti-robô.
 * Só o adaptador local do Vite pode liberar o uso em loopback.
 */
export function resolveRouteGuard(routeName: string, localDevelopment?: true): RouteGuard | null {
  const { store, isShared } = resolveStore(process.env)
  const challengeSecret = process.env.TURNSTILE_SECRET_KEY || null

  if (localDevelopment !== true && (!isShared || !challengeSecret)) {
    console.error(
      `Rota ${routeName} recusada: em deploy é obrigatório configurar KV_REST_API_URL/` +
        'KV_REST_API_TOKEN (limite de uso) e TURNSTILE_SECRET_KEY (anti-robô).',
    )
    return null
  }
  return { store, challengeSecret }
}

/** Lê o corpo com teto de tamanho, sem confiar no Content-Length declarado. */
export async function readJsonBody(request: Request, maxLength: number): Promise<unknown | null> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > maxLength) return null

  const text = await request.text()
  if (text.length > maxLength) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * Reserva uma unidade de um teto compartilhado, de forma atômica: quem não
 * coube devolve a própria contagem, para o contador nunca passar do teto.
 */
export async function reserve(
  store: UsageStore,
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<boolean> {
  if ((await store.increment(key, windowSeconds)) <= limit) return true
  await store.decrement(key, windowSeconds)
  return false
}

export async function isOverLimit(
  store: UsageStore,
  key: string,
  windowSeconds: number,
  limit: number,
): Promise<boolean> {
  return (await store.increment(key, windowSeconds)) > limit
}
