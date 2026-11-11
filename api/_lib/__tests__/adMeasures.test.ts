import { describe, expect, test } from 'vitest'
import { MAX_AD_TEXT_LENGTH, isValidAdText, parseAdMeasures } from '../adMeasures.js'

describe('parseAdMeasures', () => {
  test('accepts the three measures within range', () => {
    expect(parseAdMeasures({ widthCm: 210, heightCm: 88.04, depthCm: 95, kind: 'sofa' })).toEqual({
      widthCm: 210,
      heightCm: 88,
      depthCm: 95,
      kind: 'sofa',
    })
  })

  test('keeps null for a measure the listing does not bring', () => {
    expect(parseAdMeasures({ widthCm: 60, heightCm: null, depthCm: 58 })).toEqual({
      widthCm: 60,
      heightCm: null,
      depthCm: 58,
      kind: null,
    })
  })

  test('drops a measure outside the site range', () => {
    expect(parseAdMeasures({ widthCm: 2100, heightCm: 88, depthCm: -3 })).toEqual({
      widthCm: null,
      heightCm: 88,
      depthCm: null,
      kind: null,
    })
  })

  test('drops a value that is not a number', () => {
    expect(parseAdMeasures({ widthCm: '210', heightCm: 88, depthCm: Number.NaN })).toEqual({
      widthCm: null,
      heightCm: 88,
      depthCm: null,
      kind: null,
    })
  })

  test('drops a furniture kind outside the catalog', () => {
    expect(parseAdMeasures({ widthCm: 60, heightCm: 80, depthCm: 5, kind: 'piano' })?.kind).toBeNull()
  })

  test.each([
    null,
    'texto',
    42,
    {},
    { widthCm: null, heightCm: null, depthCm: null, kind: 'sofa' },
  ])(
    'returns null when nothing was found: %j',
    (output) => {
      expect(parseAdMeasures(output)).toBeNull()
    },
  )
})

describe('isValidAdText', () => {
  test('accepts ordinary listing text', () => {
    expect(isValidAdText('Sofá 3 lugares L 210 x A 88 x P 95 cm')).toBe(true)
  })

  test.each([undefined, 42, '', '   ', 'a'.repeat(MAX_AD_TEXT_LENGTH + 1)])(
    'rejects invalid input',
    (value) => {
      expect(isValidAdText(value)).toBe(false)
    },
  )
})
