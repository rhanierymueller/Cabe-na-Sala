import { describe, expect, test } from 'vitest'
import { MAX_AD_TEXT_LENGTH, isValidAdText, parseAdMeasures } from './adMeasures.js'

describe('parseAdMeasures', () => {
  test('aceita as três medidas dentro da faixa', () => {
    expect(parseAdMeasures({ widthCm: 210, heightCm: 88.04, depthCm: 95, kind: 'sofa' })).toEqual({
      widthCm: 210,
      heightCm: 88,
      depthCm: 95,
      kind: 'sofa',
    })
  })

  test('mantém null para a medida que o anúncio não traz', () => {
    expect(parseAdMeasures({ widthCm: 60, heightCm: null, depthCm: 58 })).toEqual({
      widthCm: 60,
      heightCm: null,
      depthCm: 58,
      kind: null,
    })
  })

  test('descarta medida fora da faixa do site', () => {
    expect(parseAdMeasures({ widthCm: 2100, heightCm: 88, depthCm: -3 })).toEqual({
      widthCm: null,
      heightCm: 88,
      depthCm: null,
      kind: null,
    })
  })

  test('descarta valor que não é número', () => {
    expect(parseAdMeasures({ widthCm: '210', heightCm: 88, depthCm: Number.NaN })).toEqual({
      widthCm: null,
      heightCm: 88,
      depthCm: null,
      kind: null,
    })
  })

  test('descarta tipo de móvel fora do catálogo', () => {
    expect(parseAdMeasures({ widthCm: 60, heightCm: 80, depthCm: 5, kind: 'piano' })?.kind).toBeNull()
  })

  test.each([
    null,
    'texto',
    42,
    {},
    { widthCm: null, heightCm: null, depthCm: null, kind: 'sofa' },
  ])(
    'devolve null quando nada foi encontrado: %j',
    (output) => {
      expect(parseAdMeasures(output)).toBeNull()
    },
  )
})

describe('isValidAdText', () => {
  test('aceita texto comum de anúncio', () => {
    expect(isValidAdText('Sofá 3 lugares L 210 x A 88 x P 95 cm')).toBe(true)
  })

  test.each([undefined, 42, '', '   ', 'a'.repeat(MAX_AD_TEXT_LENGTH + 1)])(
    'recusa entrada inválida',
    (value) => {
      expect(isValidAdText(value)).toBe(false)
    },
  )
})
