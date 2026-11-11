/**
 * Contadores de uso e registro de pedidos da rota de modelo 3D.
 *
 * Em produção usa Redis via REST (Vercel KV / Upstash), compartilhado entre
 * todas as instâncias da função. Sem ele, cai para memória — aceitável só no
 * desenvolvimento local, porque cada instância teria a própria contagem.
 */

export interface UsageStore {
  /** Soma 1 ao contador da janela atual e devolve o total. */
  readonly increment: (key: string, windowSeconds: number) => Promise<number>
  /** Marca uma chave como conhecida por um tempo. */
  readonly remember: (key: string, ttlSeconds: number) => Promise<void>
  readonly has: (key: string) => Promise<boolean>
}

interface ResolvedStore {
  readonly store: UsageStore
  /** false = memória local; não protege em produção. */
  readonly isShared: boolean
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>
type RedisCommand = readonly (string | number)[]

const MS_PER_SECOND = 1000
const REDIS_TIMEOUT_MS = 4000

/** Janela fixa: todas as instâncias calculam o mesmo índice para o mesmo instante. */
export function windowKey(key: string, windowSeconds: number, nowMs: number): string {
  return `${key}:${Math.floor(nowMs / (windowSeconds * MS_PER_SECOND))}`
}

export function createMemoryStore(now: () => number = Date.now): UsageStore {
  const counters = new Map<string, number>()
  const expirations = new Map<string, number>()

  const isAlive = (key: string): boolean => {
    const expiresAtMs = expirations.get(key)
    if (expiresAtMs !== undefined && expiresAtMs > now()) return true
    expirations.delete(key)
    counters.delete(key)
    return false
  }

  return {
    async increment(key, windowSeconds) {
      const bucket = windowKey(key, windowSeconds, now())
      const total = (isAlive(bucket) ? (counters.get(bucket) ?? 0) : 0) + 1
      counters.set(bucket, total)
      expirations.set(bucket, now() + windowSeconds * MS_PER_SECOND)
      return total
    },
    async remember(key, ttlSeconds) {
      expirations.set(key, now() + ttlSeconds * MS_PER_SECOND)
    },
    async has(key) {
      return isAlive(key)
    },
  }
}

/** Redis pela API REST do Upstash (a mesma do Vercel KV). Erro de rede propaga. */
export function createRedisStore(
  restUrl: string,
  token: string,
  fetchImpl: FetchLike = fetch,
  now: () => number = Date.now,
): UsageStore {
  const run = async (commands: readonly RedisCommand[]): Promise<unknown[]> => {
    const response = await fetchImpl(`${restUrl.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`Redis respondeu ${response.status}`)

    const results = (await response.json()) as readonly { result?: unknown; error?: string }[]
    const failed = results.find((entry) => entry.error)
    if (failed) throw new Error(`Redis: ${failed.error}`)
    return results.map((entry) => entry.result)
  }

  return {
    async increment(key, windowSeconds) {
      const bucket = windowKey(key, windowSeconds, now())
      const [total] = await run([
        ['INCR', bucket],
        ['EXPIRE', bucket, windowSeconds],
      ])
      if (typeof total !== 'number') throw new Error('Redis: contador inválido')
      return total
    },
    async remember(key, ttlSeconds) {
      await run([['SET', key, '1', 'EX', ttlSeconds]])
    },
    async has(key) {
      const [exists] = await run([['EXISTS', key]])
      return exists === 1
    },
  }
}

const memoryFallback = createMemoryStore()

/** Escolhe o armazenamento pelas variáveis de ambiente (nomes do Vercel KV ou do Upstash). */
export function resolveStore(env: Readonly<Record<string, string | undefined>>): ResolvedStore {
  const restUrl = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN
  if (restUrl && token) return { store: createRedisStore(restUrl, token), isShared: true }
  return { store: memoryFallback, isShared: false }
}
