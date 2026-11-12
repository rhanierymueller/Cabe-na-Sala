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
  /**
   * Reserva uma unidade de um teto, de forma atômica. Devolve a chave da
   * janela que contou (para o release) ou null quando o teto já foi atingido.
   */
  readonly reserve: (key: string, windowSeconds: number, limit: number) => Promise<string | null>
  /** Desfaz uma reserva que não virou gasto, na mesma janela em que ela contou. */
  readonly release: (reservation: string) => Promise<void>
  readonly get: (key: string) => Promise<string | null>
  readonly set: (key: string, value: string, ttlSeconds: number) => Promise<void>
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
  const entries = new Map<string, { value: string; expiresAtMs: number }>()

  const get = (key: string): string | null => {
    const entry = entries.get(key)
    if (entry && entry.expiresAtMs > now()) return entry.value
    entries.delete(key)
    return null
  }
  const set = (key: string, value: string, ttlSeconds: number): void => {
    entries.set(key, { value, expiresAtMs: now() + ttlSeconds * MS_PER_SECOND })
  }

  return {
    async increment(key, windowSeconds) {
      const bucket = windowKey(key, windowSeconds, now())
      const total = Number(get(bucket) ?? 0) + 1
      set(bucket, String(total), windowSeconds)
      return total
    },
    async reserve(key, windowSeconds, limit) {
      const bucket = windowKey(key, windowSeconds, now())
      const total = Number(get(bucket) ?? 0)
      if (total >= limit) return null
      set(bucket, String(total + 1), windowSeconds)
      return bucket
    },
    async release(reservation) {
      const entry = entries.get(reservation)
      const total = Number(get(reservation) ?? 0)
      if (entry && total > 0) entries.set(reservation, { ...entry, value: String(total - 1) })
    },
    async get(key) {
      return get(key)
    },
    async set(key, value, ttlSeconds) {
      set(key, value, ttlSeconds)
    },
  }
}

/** Conta e, se passou do teto, desconta na mesma chamada: o contador nunca fica acima do teto. */
const RESERVE_SCRIPT = [
  "local total = redis.call('INCR', KEYS[1])",
  "redis.call('EXPIRE', KEYS[1], ARGV[2])",
  "if total > tonumber(ARGV[1]) then redis.call('DECR', KEYS[1]) return 0 end",
  'return 1',
].join('\n')
/** Desconta sem ir abaixo de zero e sem recriar uma chave que já expirou. */
const RELEASE_SCRIPT = [
  "if tonumber(redis.call('GET', KEYS[1]) or '0') > 0 then redis.call('DECR', KEYS[1]) end",
  'return 1',
].join('\n')

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
    async reserve(key, windowSeconds, limit) {
      const bucket = windowKey(key, windowSeconds, now())
      const [reserved] = await run([['EVAL', RESERVE_SCRIPT, 1, bucket, limit, windowSeconds]])
      if (reserved !== 0 && reserved !== 1) throw new Error('Redis: reserva inválida')
      return reserved === 1 ? bucket : null
    },
    async release(reservation) {
      await run([['EVAL', RELEASE_SCRIPT, 1, reservation]])
    },
    async get(key) {
      const [value] = await run([['GET', key]])
      if (value !== null && typeof value !== 'string') throw new Error('Redis: valor inválido')
      return value
    },
    async set(key, value, ttlSeconds) {
      const [result] = await run([['SET', key, value, 'EX', ttlSeconds]])
      if (result !== 'OK') throw new Error('Redis: falha ao gravar valor')
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
