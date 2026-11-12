import { describe, expect, test } from 'vitest'
import { buildToolSearch, parseToolUrl } from '../../../utils/urlState'
import { FURNITURE_CATALOG, FURNITURE_KINDS } from '../catalog'

const MEASURES = { widthM: 0.45, heightM: 0.28, depthM: 0.35 }

describe('other (any object, by its measures)', () => {
  test('is offered last in the picker, after every modeled piece of furniture', () => {
    expect(FURNITURE_KINDS.at(-1)).toBe('other')
    expect(FURNITURE_CATALOG.other.label).toBe('Outro')
  })

  test('is a single block with exactly the typed measures, resting on the floor', () => {
    const layout = FURNITURE_CATALOG.other.computeLayout(MEASURES)

    expect(layout).toHaveLength(1)
    expect(layout[0].size).toEqual([MEASURES.widthM, MEASURES.heightM, MEASURES.depthM])
    expect(layout[0].position).toEqual([0, MEASURES.heightM / 2, 0])
  })

  test('has its own share link', () => {
    const search = buildToolSearch('other', { widthCm: 45, heightCm: 28, depthCm: 35 })

    expect(search).toBe('?movel=outro&l=45&a=28&p=35')
    expect(parseToolUrl(search)?.kind).toBe('other')
  })
})
