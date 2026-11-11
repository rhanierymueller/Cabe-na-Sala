import { describe, expect, test } from 'vitest'
import { computeResizedSize } from '../imageResize'

describe('computeResizedSize', () => {
  test('keeps an image that is already small enough', () => {
    const original = { widthPx: 800, heightPx: 600 }

    expect(computeResizedSize(original, 1024)).toEqual(original)
  })

  test('shrinks a landscape image to the max side keeping the proportion', () => {
    expect(computeResizedSize({ widthPx: 4000, heightPx: 3000 }, 1024)).toEqual({
      widthPx: 1024,
      heightPx: 768,
    })
  })

  test('shrinks a portrait image by its height', () => {
    expect(computeResizedSize({ widthPx: 1500, heightPx: 3000 }, 1000)).toEqual({
      widthPx: 500,
      heightPx: 1000,
    })
  })

  test('never collapses a very thin image to zero', () => {
    expect(computeResizedSize({ widthPx: 10000, heightPx: 2 }, 100).heightPx).toBe(1)
  })
})
