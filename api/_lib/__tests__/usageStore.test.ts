import { describe, expect, test, vi } from 'vitest'
import { createMemoryStore, createRedisStore, resolveStore, windowKey } from '../usageStore.js'

const HOUR_S = 3600

describe('windowKey', () => {
  test('is the same for two instants inside the same window', () => {
    expect(windowKey('ip', HOUR_S, 1_000)).toBe(windowKey('ip', HOUR_S, 3_000_000))
  })

  test('changes when the window turns', () => {
    expect(windowKey('ip', HOUR_S, 0)).not.toBe(windowKey('ip', HOUR_S, HOUR_S * 1000))
  })
})

describe('createMemoryStore', () => {
  test('counts up inside a window and restarts in the next one', async () => {
    let nowMs = 0
    const store = createMemoryStore(() => nowMs)

    expect(await store.increment('ip', HOUR_S)).toBe(1)
    expect(await store.increment('ip', HOUR_S)).toBe(2)
    nowMs = HOUR_S * 1000 + 1
    expect(await store.increment('ip', HOUR_S)).toBe(1)
  })

  test('counts each key on its own', async () => {
    const store = createMemoryStore(() => 0)
    await store.increment('a', HOUR_S)

    expect(await store.increment('b', HOUR_S)).toBe(1)
  })

  test('remembers a key only until it expires', async () => {
    let nowMs = 0
    const store = createMemoryStore(() => nowMs)
    await store.set('job:1', 'request-id', 60)

    expect(await store.get('job:1')).toBe('request-id')
    expect(await store.get('job:2')).toBeNull()
    nowMs = 61_000
    expect(await store.get('job:1')).toBeNull()
  })
})

describe('createRedisStore', () => {
  const respondWith = (results: unknown[], ok = true) =>
    vi.fn(async () => new Response(JSON.stringify(results), { status: ok ? 200 : 500 }))

  test('increments through one authenticated pipeline with an expiry', async () => {
    const fetchImpl = respondWith([{ result: 4 }, { result: 1 }])
    const store = createRedisStore('https://kv.example/', 'segredo', fetchImpl, () => 0)

    const total = await store.increment('ip:1.2.3.4', HOUR_S)

    expect(total).toBe(4)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://kv.example/pipeline')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer segredo')
    expect(JSON.parse(init.body as string)).toEqual([
      ['INCR', 'ip:1.2.3.4:0'],
      ['EXPIRE', 'ip:1.2.3.4:0', HOUR_S],
    ])
  })

  test('reads a stored value and distinguishes an expired key', async () => {
    const fetchImpl = respondWith([{ result: 'request-id' }])
    fetchImpl.mockResolvedValueOnce(Response.json([{ result: null }]))
    const store = createRedisStore('https://kv.example', 't', fetchImpl)

    expect(await store.get('job:expired')).toBeNull()
    expect(await store.get('job:abc')).toBe('request-id')
  })

  test('stores a value with an expiry', async () => {
    const fetchImpl = respondWith([{ result: 'OK' }])
    const store = createRedisStore('https://kv.example', 't', fetchImpl)

    await store.set('job:abc', 'request-id', 60)

    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual([['SET', 'job:abc', 'request-id', 'EX', 60]])
  })

  test('throws when Redis is down, so the caller can refuse the request', async () => {
    const store = createRedisStore('https://kv.example', 't', respondWith([], false))

    await expect(store.increment('ip', HOUR_S)).rejects.toThrow(/500/)
  })

  test('throws when a command comes back with an error', async () => {
    const store = createRedisStore('https://kv.example', 't', respondWith([{ error: 'WRONGTYPE' }]))

    await expect(store.increment('ip', HOUR_S)).rejects.toThrow(/WRONGTYPE/)
  })
})

describe('resolveStore', () => {
  test('uses shared storage when the Vercel KV variables exist', () => {
    const resolved = resolveStore({ KV_REST_API_URL: 'https://kv', KV_REST_API_TOKEN: 't' })

    expect(resolved.isShared).toBe(true)
  })

  test('accepts the Upstash variable names too', () => {
    const resolved = resolveStore({
      UPSTASH_REDIS_REST_URL: 'https://kv',
      UPSTASH_REDIS_REST_TOKEN: 't',
    })

    expect(resolved.isShared).toBe(true)
  })

  test('falls back to memory, flagged as not shared', () => {
    expect(resolveStore({}).isShared).toBe(false)
    expect(resolveStore({ KV_REST_API_URL: 'https://kv' }).isShared).toBe(false)
  })
})
