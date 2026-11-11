import { describe, expect, test } from 'vitest'
import {
  MAX_IMAGE_DATA_URL_LENGTH,
  clientIpFrom,
  createRateLimiter,
  isSameOrigin,
  isTrustedModelUrl,
  isValidImageDataUrl,
  isValidRequestId,
} from './modelRequest.js'

describe('isValidImageDataUrl', () => {
  test.each(['jpeg', 'png', 'webp'])('accepts a base64 %s data URL', (type) => {
    expect(isValidImageDataUrl(`data:image/${type};base64,AAAA`)).toBe(true)
  })

  test.each([
    ['a remote URL', 'https://exemplo.com/sofa.jpg'],
    ['an SVG (can carry script)', 'data:image/svg+xml;base64,AAAA'],
    ['non-base64 payload', 'data:image/png;base64,<script>'],
    ['a number', 42],
    ['nothing', undefined],
  ])('rejects %s', (_label, value) => {
    expect(isValidImageDataUrl(value)).toBe(false)
  })

  test('rejects an image above the size limit', () => {
    const tooLarge = `data:image/png;base64,${'A'.repeat(MAX_IMAGE_DATA_URL_LENGTH)}`

    expect(isValidImageDataUrl(tooLarge)).toBe(false)
  })
})

describe('isValidRequestId', () => {
  test('accepts a provider request id', () => {
    expect(isValidRequestId('764cabcf-b745-4b3e-ae38-1200304cf45b')).toBe(true)
  })

  test.each(['', 'a', '../../etc/passwd', 'id com espaço', 'x'.repeat(65)])(
    'rejects %j',
    (value) => {
      expect(isValidRequestId(value)).toBe(false)
    },
  )
})

describe('isTrustedModelUrl', () => {
  test('accepts an https file on the provider CDN', () => {
    expect(isTrustedModelUrl('https://v3.fal.media/files/abc/model.glb')).toBe(true)
  })

  test.each([
    'http://v3.fal.media/files/model.glb',
    'https://evil.example/model.glb',
    'https://fal.media.evil.example/model.glb',
    'javascript:alert(1)',
    'não é url',
  ])('rejects %s', (value) => {
    expect(isTrustedModelUrl(value)).toBe(false)
  })
})

describe('isSameOrigin', () => {
  test('accepts a request coming from the site itself', () => {
    expect(isSameOrigin('https://cabenasala.com', 'cabenasala.com')).toBe(true)
    expect(isSameOrigin('http://localhost:5173', 'localhost:5173')).toBe(true)
  })

  test.each([
    ['another site', 'https://outro.com', 'cabenasala.com'],
    ['no Origin header (script)', null, 'cabenasala.com'],
    ['a malformed Origin', 'cabenasala.com', 'cabenasala.com'],
  ])('rejects %s', (_label, origin, host) => {
    expect(isSameOrigin(origin, host)).toBe(false)
  })
})

describe('createRateLimiter', () => {
  const WINDOW_MS = 1000

  test('allows up to the limit and blocks the next attempt', () => {
    const limiter = createRateLimiter(2, WINDOW_MS)

    expect(limiter.tryConsume('ip', 0)).toBe(true)
    expect(limiter.tryConsume('ip', 10)).toBe(true)
    expect(limiter.tryConsume('ip', 20)).toBe(false)
  })

  test('frees up again once the window has passed', () => {
    const limiter = createRateLimiter(1, WINDOW_MS)
    limiter.tryConsume('ip', 0)

    expect(limiter.tryConsume('ip', WINDOW_MS + 1)).toBe(true)
  })

  test('counts each key separately', () => {
    const limiter = createRateLimiter(1, WINDOW_MS)
    limiter.tryConsume('a', 0)

    expect(limiter.tryConsume('b', 0)).toBe(true)
  })
})

describe('clientIpFrom', () => {
  test('prefers the address written by the platform over a client-supplied one', () => {
    const headers = new Headers({
      'x-forwarded-for': '1.2.3.4',
      'x-real-ip': '203.0.113.7',
    })

    expect(clientIpFrom(headers)).toBe('203.0.113.7')
  })

  test('takes the first address of the chain', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })

    expect(clientIpFrom(headers)).toBe('203.0.113.7')
  })

  test('falls back to one shared key when there is no address', () => {
    expect(clientIpFrom(new Headers())).toBe('desconhecido')
  })
})
