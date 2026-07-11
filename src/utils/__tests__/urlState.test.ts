import { describe, expect, test } from 'vitest'
import { FURNITURE_CATALOG } from '../../components/furniture/catalog'
import { buildToolSearch, parseToolUrl } from '../urlState'

describe('parseToolUrl', () => {
  test('returns null when there is no movel param', () => {
    expect(parseToolUrl('')).toBeNull()
    expect(parseToolUrl('?l=60&a=87&p=63')).toBeNull()
  })

  test('returns null for an unknown furniture slug', () => {
    expect(parseToolUrl('?movel=piano')).toBeNull()
  })

  test('parses a complete url into kind and dimensions', () => {
    const state = parseToolUrl('?movel=fogao&l=60&a=87&p=63')

    expect(state).toEqual({
      kind: 'stove',
      dimensionsCm: { widthCm: 60, heightCm: 87, depthCm: 63 },
    })
  })

  test('maps every catalog slug to its furniture kind', () => {
    expect(parseToolUrl('?movel=sofa')?.kind).toBe('sofa')
    expect(parseToolUrl('?movel=geladeira')?.kind).toBe('fridge')
    expect(parseToolUrl('?movel=guarda-roupa')?.kind).toBe('wardrobe')
    expect(parseToolUrl('?movel=cama')?.kind).toBe('bed')
    expect(parseToolUrl('?movel=mesa')?.kind).toBe('table')
  })

  test('falls back to catalog defaults for missing or invalid dimensions', () => {
    const state = parseToolUrl('?movel=sofa&l=210&a=abc')
    const defaults = FURNITURE_CATALOG.sofa.defaultDimensionsCm

    expect(state?.dimensionsCm.widthCm).toBe(210)
    expect(state?.dimensionsCm.heightCm).toBe(defaults.heightCm)
    expect(state?.dimensionsCm.depthCm).toBe(defaults.depthCm)
  })

  test('accepts comma as decimal separator (pt-BR)', () => {
    const state = parseToolUrl('?movel=fogao&l=59,5')

    expect(state?.dimensionsCm.widthCm).toBeCloseTo(59.5, 5)
  })

  test('clamps dimensions outside the allowed limits', () => {
    const state = parseToolUrl('?movel=fogao&l=2&a=9999')

    expect(state?.dimensionsCm.widthCm).toBe(10)
    expect(state?.dimensionsCm.heightCm).toBe(400)
  })
})

describe('buildToolSearch', () => {
  test('builds the canonical share url search', () => {
    const search = buildToolSearch('stove', { widthCm: 60, heightCm: 87, depthCm: 63 })

    expect(search).toBe('?movel=fogao&l=60&a=87&p=63')
  })

  test('keeps decimal values readable with comma', () => {
    const search = buildToolSearch('sofa', { widthCm: 210.5, heightCm: 90, depthCm: 95 })

    expect(search).toContain('l=210%2C5')
  })

  test('round-trips through parseToolUrl for every kind', () => {
    for (const kind of Object.keys(FURNITURE_CATALOG) as (keyof typeof FURNITURE_CATALOG)[]) {
      const dimensions = FURNITURE_CATALOG[kind].defaultDimensionsCm
      const state = parseToolUrl(buildToolSearch(kind, dimensions))

      expect(state).toEqual({ kind, dimensionsCm: dimensions })
    }
  })
})
