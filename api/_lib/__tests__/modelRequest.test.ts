import { describe, expect, test } from 'vitest'
import {
  pickModelUrl,
  MAX_IMAGE_DATA_URL_LENGTH,
  clientIpFrom,
  imageContentMatchesType,
  isCrossSiteFetch,
  isSameOrigin,
  isTrustedModelUrl,
  isValidImageDataUrl,
  isValidRequestId,
} from '../modelRequest.js'

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

describe('imageContentMatchesType', () => {
  const toDataUrl = (type: string, bytes: number[]): string =>
    `data:image/${type};base64,${Buffer.from([...bytes, ...new Array(24).fill(0)]).toString('base64')}`
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const JPEG = [0xff, 0xd8, 0xff, 0xe0]
  const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]

  test.each([
    ['png', PNG],
    ['jpeg', JPEG],
    ['webp', WEBP],
  ])('accepts a real %s file', (type, bytes) => {
    expect(imageContentMatchesType(toDataUrl(type, bytes))).toBe(true)
  })

  test('rejects a file whose content is not what the type says', () => {
    expect(imageContentMatchesType(toDataUrl('png', JPEG))).toBe(false)
    expect(imageContentMatchesType(toDataUrl('jpeg', [0x4d, 0x5a, 0x90]))).toBe(false)
  })

  test('rejects something that is not an image data URL', () => {
    expect(imageContentMatchesType('data:text/html;base64,AAAA')).toBe(false)
  })
})

describe('isCrossSiteFetch', () => {
  test('lets same-origin and header-less requests through', () => {
    expect(isCrossSiteFetch('same-origin')).toBe(false)
    expect(isCrossSiteFetch(null)).toBe(false)
  })

  test.each(['cross-site', 'same-site', 'none'])('flags %s', (value) => {
    expect(isCrossSiteFetch(value)).toBe(true)
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

describe('pickModelUrl', () => {
  const glb = (name: string) => ({ url: `https://v3b.fal.media/files/${name}.glb` })

  test('uses the single model when only one object was found', () => {
    expect(pickModelUrl({ model_glb: glb('one'), metadata: [{ object_index: 0, scale: [[0.5, 0.5, 0.5]] }] })).toBe(
      glb('one').url,
    )
  })

  test('picks the largest object instead of the combined scene', () => {
    const data = {
      model_glb: glb('scene'),
      individual_glbs: [glb('lamp'), glb('wardrobe'), glb('chair')],
      metadata: [
        { object_index: 0, scale: [[0.2, 0.2, 0.2]] },
        { object_index: 1, scale: [[1.1, 1.1, 1.1]] },
        { object_index: 2, scale: [[0.4, 0.4, 0.4]] },
      ],
    }

    expect(pickModelUrl(data)).toBe(glb('wardrobe').url)
  })

  test('falls back to the first object when the sizes are unreadable', () => {
    const data = { model_glb: glb('scene'), individual_glbs: [glb('a'), glb('b')], metadata: [{}, { scale: 'big' }] }

    expect(pickModelUrl(data)).toBe(glb('a').url)
  })

  test('returns nothing for an answer without a model', () => {
    expect(pickModelUrl(null)).toBeUndefined()
  })
})
