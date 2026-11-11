import { describe, expect, test } from 'vitest'
import { segmentPrompt } from '../furnitureKinds.js'

describe('segmentPrompt', () => {
  test('names the detected furniture in English for the 3D segmenter', () => {
    expect(segmentPrompt('wardrobe')).toBe('wardrobe')
    expect(segmentPrompt('fridge')).toBe('refrigerator')
    expect(segmentPrompt('frame')).toBe('picture frame')
  })

  test('falls back to a generic word when no kind was recognized', () => {
    expect(segmentPrompt(null)).toBe('furniture')
  })
})
