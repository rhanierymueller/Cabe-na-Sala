import { afterEach, describe, expect, test, vi } from 'vitest'
import { isPlausibleChallengeToken, verifyChallenge } from './challenge.js'

afterEach(() => vi.restoreAllMocks())

const respondWith = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }))

describe('verifyChallenge', () => {
  test('passes when Cloudflare confirms the token', async () => {
    const fetchImpl = respondWith({ success: true })

    const passed = await verifyChallenge('token', 'segredo', '203.0.113.7', fetchImpl)

    expect(passed).toBe(true)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('turnstile/v0/siteverify')
    const sent = init.body as URLSearchParams
    expect(sent.get('secret')).toBe('segredo')
    expect(sent.get('response')).toBe('token')
    expect(sent.get('remoteip')).toBe('203.0.113.7')
  })

  test('fails when Cloudflare rejects the token', async () => {
    expect(await verifyChallenge('t', 's', 'ip', respondWith({ success: false }))).toBe(false)
  })

  test('fails closed when the verification service errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const offline = vi.fn(async () => {
      throw new Error('rede fora')
    })

    expect(await verifyChallenge('t', 's', 'ip', respondWith({}, 500))).toBe(false)
    expect(await verifyChallenge('t', 's', 'ip', offline)).toBe(false)
  })
})

describe('isPlausibleChallengeToken', () => {
  test('accepts a normal token', () => {
    expect(isPlausibleChallengeToken('0.abcDEF-123')).toBe(true)
  })

  test.each([[''], [undefined], ['x'.repeat(2049)], [42]])('rejects %j', (value) => {
    expect(isPlausibleChallengeToken(value)).toBe(false)
  })
})
