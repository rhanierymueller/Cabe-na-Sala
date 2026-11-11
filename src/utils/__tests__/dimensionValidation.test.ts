import { describe, expect, test } from 'vitest'
import { MAX_DIMENSION_CM, MIN_DIMENSION_CM } from '../../constants/dimensions'
import {
  clampDimensionCm,
  fillMissingMeasures,
  isWithinDimensionLimits,
  parseDimensionInput,
} from '../dimensionValidation'

describe('parseDimensionInput', () => {
  test('parses integer input', () => {
    expect(parseDimensionInput('60')).toBe(60)
  })

  test('parses decimal input with dot', () => {
    expect(parseDimensionInput('60.5')).toBe(60.5)
  })

  test('parses decimal input with comma (pt-BR)', () => {
    expect(parseDimensionInput('60,5')).toBe(60.5)
  })

  test('ignores surrounding whitespace', () => {
    expect(parseDimensionInput('  87 ')).toBe(87)
  })

  test('returns null for empty input', () => {
    expect(parseDimensionInput('')).toBeNull()
  })

  test('returns null for non-numeric input', () => {
    expect(parseDimensionInput('abc')).toBeNull()
  })

  test('returns null for zero or negative values', () => {
    expect(parseDimensionInput('0')).toBeNull()
    expect(parseDimensionInput('-10')).toBeNull()
  })
})

describe('isWithinDimensionLimits', () => {
  test('accepts values inside the allowed range', () => {
    expect(isWithinDimensionLimits(60)).toBe(true)
    expect(isWithinDimensionLimits(MIN_DIMENSION_CM)).toBe(true)
    expect(isWithinDimensionLimits(MAX_DIMENSION_CM)).toBe(true)
  })

  test('rejects values outside the allowed range', () => {
    expect(isWithinDimensionLimits(MIN_DIMENSION_CM - 1)).toBe(false)
    expect(isWithinDimensionLimits(MAX_DIMENSION_CM + 1)).toBe(false)
  })
})

describe('clampDimensionCm', () => {
  test('keeps in-range values unchanged', () => {
    expect(clampDimensionCm(60)).toBe(60)
  })

  test('clamps values below the minimum', () => {
    expect(clampDimensionCm(MIN_DIMENSION_CM / 2)).toBe(MIN_DIMENSION_CM)
  })

  test('clamps values above the maximum', () => {
    expect(clampDimensionCm(9999)).toBe(MAX_DIMENSION_CM)
  })
})

describe('fillMissingMeasures', () => {
  const BASE = { widthCm: 60, heightCm: 87, depthCm: 63 }

  test('keeps the current value for a measure the listing does not bring', () => {
    expect(fillMissingMeasures({ widthCm: 76, heightCm: null, depthCm: null }, BASE)).toEqual({
      widthCm: 76,
      heightCm: 87,
      depthCm: 63,
    })
  })

  test('clamps a found measure to the tool limits', () => {
    expect(fillMissingMeasures({ widthCm: 900, heightCm: 0.2, depthCm: 63 }, BASE)).toEqual({
      widthCm: MAX_DIMENSION_CM,
      heightCm: MIN_DIMENSION_CM,
      depthCm: 63,
    })
  })
})
