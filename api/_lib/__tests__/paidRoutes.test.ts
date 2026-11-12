import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as readMeasures } from '../../measures.js'
import { GET as getModel, POST as generateModel } from '../../model3d.js'
import { windowKey } from '../usageStore.js'

const fakes = vi.hoisted(() => ({
  submit: vi.fn(),
  status: vi.fn(),
  result: vi.fn(),
  analyze: vi.fn(),
}))

vi.mock('@fal-ai/client', () => ({
  fal: { config: vi.fn(), queue: { submit: fakes.submit, status: fakes.status, result: fakes.result } },
}))
vi.mock(import('../claude.js'), async (importOriginal) => ({
  ...await importOriginal(),
  askClaudeForJson: fakes.analyze,
}))

const origin = 'https://cabenasala.example'
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XgX8AAAAASUVORK5CYII='
const providerId = '00000000-0000-4000-8000-000000000001'
const modelUrl = 'https://files.fal.media/synthetic.glb'
const daySeconds = 86_400
const values = new Map<string, string>()
/** Valor que o Redis falso se recusa a gravar, para simular falha só nessa escrita. */
let failingSetValue: string | null = null
/** Site para o qual o Turnstile falso diz ter emitido o token. */
let challengeHostname = new URL(origin).hostname

function post(route: string, body: unknown, ip = '192.0.2.2'): Request {
  return new Request(origin + '/api/' + route, {
    method: 'POST',
    headers: { origin, host: new URL(origin).host, 'x-vercel-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

function generate(ip?: string): Promise<Response> {
  return generateModel(post('model3d', { image, challengeToken: 'synthetic', polling: 'bearer' }, ip))
}

function poll(token?: string): Promise<Response> {
  const headers = new Headers({ 'x-vercel-forwarded-for': '198.51.100.8' })
  if (token) headers.set('authorization', 'Bearer ' + token)
  return getModel(new Request(origin + '/api/model3d', { headers }))
}

beforeEach(() => {
  vi.resetAllMocks()
  values.clear()
  failingSetValue = null
  challengeHostname = new URL(origin).hostname
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(0)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const env = {
    VERCEL: undefined,
    FAL_KEY: 'synthetic',
    ANTHROPIC_API_KEY: 'synthetic',
    TURNSTILE_SECRET_KEY: 'synthetic',
    KV_REST_API_URL: 'https://redis.invalid',
    KV_REST_API_TOKEN: 'synthetic',
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
    MODEL3D_DAILY_LIMIT: '1',
  }
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value)
  fakes.analyze.mockResolvedValue({ ok: true, kind: 'sofa', object: 'sofa' })
  fakes.submit.mockResolvedValue({ request_id: providerId })
  fakes.status.mockResolvedValue({ status: 'COMPLETED' })
  fakes.result.mockResolvedValue({ data: { model_glb: { url: modelUrl } } })
  vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
    if (input === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      return Response.json({ success: true, hostname: challengeHostname })
    }
    if (input !== 'https://redis.invalid/pipeline') throw new Error('Unexpected network call')
    const commands = JSON.parse(init?.body as string) as string[][]
    return Response.json(commands.map(([command, key, value]) => {
      switch (command) {
        case 'GET': return { result: values.get(key) ?? null }
        case 'SET':
          if (value === failingSetValue) return { error: 'READONLY' }
          values.set(key, value)
          return { result: 'OK' }
        case 'EXPIRE': return { result: 1 }
        case 'DECR': {
          const total = Number(values.get(key) ?? 0) - 1
          values.set(key, String(total))
          return { result: total }
        }
        case 'INCR': {
          const total = Number(values.get(key) ?? 0) + 1
          values.set(key, String(total))
          return { result: total }
        }
        default: throw new Error('Unexpected Redis command')
      }
    }))
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('paid routes', () => {
  it.each([
    ['model3d', generateModel], ['measures', readMeasures],
  ] as const)('%s fails closed without Turnstile even when VERCEL is absent', async (route, handler) => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', undefined)

    expect((await handler(post(route, {}))).status).toBe(503)
    expect(fetch).not.toHaveBeenCalled()
    expect(fakes.analyze).not.toHaveBeenCalled()
    expect(fakes.submit).not.toHaveBeenCalled()
  })

  it('only accepts the memory fallback when the local adapter explicitly allows it', async () => {
    vi.stubEnv('KV_REST_API_URL', undefined)
    vi.stubEnv('TURNSTILE_SECRET_KEY', undefined)

    expect((await generateModel(post('model3d', {}))).status).toBe(503)
    expect((await generateModel(post('model3d', {}), true)).status).toBe(400)
  })

  it('rejects an old client before spending on a model it cannot poll', async () => {
    expect((await generateModel(post('model3d', { image }))).status).toBe(409)
    expect(fetch).not.toHaveBeenCalled()
    expect(fakes.analyze).not.toHaveBeenCalled()
    expect(fakes.submit).not.toHaveBeenCalled()
  })

  it('checks the generation budget before asking Claude', async () => {
    expect((await generate()).status).toBe(202)
    expect((await generate('192.0.2.3')).status).toBe(429)
    expect(fakes.analyze).toHaveBeenCalledTimes(1)
    expect(fakes.submit).toHaveBeenCalledExactlyOnceWith('fal-ai/sam-3/3d-objects', {
      input: { image_url: image, prompt: 'sofa', export_textured_glb: true },
    })
  })

  it('limits concurrent paid analyses even before a generation has been queued', async () => {
    values.set(windowKey('check:global:day', daySeconds, Date.now()), '299')
    const responses = await Promise.all([generate('192.0.2.3'), generate('192.0.2.4')])

    expect(responses.map((response) => response.status).sort()).toEqual([202, 429])
    expect(fakes.analyze).toHaveBeenCalledTimes(1)
  })

  it('requires the private credential and returns a cached result without querying fal.ai again', async () => {
    const created = await generate()
    const { data } = await created.json() as { data: { pollToken: string; kind: string } }
    expect(data).toEqual({ pollToken: expect.stringMatching(/^[A-Za-z0-9_-]{43}$/), kind: 'sofa' })
    expect(Array.from(values.keys()).join()).not.toContain(data.pollToken)

    const legacyRequest = new Request(origin + '/api/model3d?id=' + providerId)
    expect((await getModel(legacyRequest)).status).toBe(401)
    expect((await poll('A'.repeat(43))).status).toBe(404)
    expect(fakes.status).not.toHaveBeenCalled()

    const first = await poll(data.pollToken)
    const second = await poll(data.pollToken)
    expect(await first.json()).toMatchObject({ data: { status: 'ready', modelUrl } })
    expect(await second.json()).toMatchObject({ data: { status: 'ready', modelUrl } })
    expect(fakes.status).toHaveBeenCalledExactlyOnceWith('fal-ai/sam-3/3d-objects', { requestId: providerId, logs: false })
    expect(fakes.result).toHaveBeenCalledTimes(1)
  })

  it('still answers ready when only caching the finished model fails', async () => {
    const created = await generate()
    const { data } = await created.json() as { data: { pollToken: string } }
    failingSetValue = modelUrl

    const response = await poll(data.pollToken)

    expect(await response.json()).toMatchObject({ data: { status: 'ready', modelUrl } })
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('cache'), expect.anything())
  })

  it('rejects a Turnstile token solved on another site', async () => {
    challengeHostname = 'outro-site.example'

    expect((await generate()).status).toBe(403)
    expect((await readMeasures(post('measures', { text: 'sofa 200 x 90 x 80 cm', challengeToken: 'synthetic' }))).status).toBe(403)
    expect(fakes.analyze).not.toHaveBeenCalled()
  })

  it('pays for one photo check per free generation slot, even under a burst', async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) => generate('192.0.2.' + (index + 10))),
    )

    expect(responses.filter((response) => response.status === 202)).toHaveLength(1)
    expect(responses.filter((response) => response.status === 429)).toHaveLength(9)
    expect(fakes.analyze).toHaveBeenCalledTimes(1)
  })

  it('gives the daily slot back when the provider fails to queue', async () => {
    fakes.submit.mockRejectedValueOnce(new Error('provider down'))

    expect((await generate('192.0.2.3')).status).toBe(502)
    expect((await generate('192.0.2.4')).status).toBe(202)
  })

  it('gives the daily slot back when the photo is refused', async () => {
    fakes.analyze.mockResolvedValueOnce({ ok: false, reason: 'no_object' })

    expect((await generate('192.0.2.3')).status).toBe(422)
    expect((await generate('192.0.2.4')).status).toBe(202)
  })
})
