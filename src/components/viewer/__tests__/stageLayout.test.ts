import { describe, expect, test } from 'vitest'
import type { DimensionsMeters } from '../../../types/furniture'
import {
  FIGURE_HALF_WIDTH_M,
  computeFigurePosition,
  computeStageFrame,
  formatMeasureBackdrop,
} from '../stageLayout'

const SOFA: DimensionsMeters = { widthM: 2.1, heightM: 0.88, depthM: 0.95 }
const FRIDGE: DimensionsMeters = { widthM: 0.7, heightM: 1.7, depthM: 0.7 }
const WARDROBE: DimensionsMeters = { widthM: 2.7, heightM: 2.4, depthM: 0.6 }
const FRAME_OPTIONS = { fovDegrees: 30, margin: 1.2 }
const LANDSCAPE = 16 / 9
const PORTRAIT = 9 / 16

function halfAngles(aspect: number): { horizontal: number; vertical: number } {
  const vertical = (FRAME_OPTIONS.fovDegrees * Math.PI) / 360
  return { horizontal: Math.atan(Math.tan(vertical) * aspect), vertical }
}

describe('computeFigurePosition', () => {
  test('stands on the floor to the left of the furniture without touching it', () => {
    const [x, y] = computeFigurePosition(SOFA)

    expect(y).toBe(0)
    expect(x + FIGURE_HALF_WIDTH_M).toBeLessThan(-SOFA.widthM / 2)
  })

  test('stays at the front line so tall furniture does not hide the person', () => {
    const [, , z] = computeFigurePosition(FRIDGE)

    expect(z).toBeGreaterThan(0)
    expect(z).toBeLessThanOrEqual(FRIDGE.depthM / 2)
  })

  test('moves away as the furniture gets wider', () => {
    const [narrowX] = computeFigurePosition(FRIDGE)
    const [wideX] = computeFigurePosition(WARDROBE)

    expect(wideX).toBeLessThan(narrowX)
  })
})

describe('formatMeasureBackdrop', () => {
  test('shows width, height and depth in whole centimeters', () => {
    expect(formatMeasureBackdrop(SOFA)).toBe('210 × 88 × 95')
  })

  test('rounds measures that are mid-animation', () => {
    expect(formatMeasureBackdrop({ widthM: 2.0949, heightM: 0.8751, depthM: 0.955 })).toBe(
      '209 × 88 × 96',
    )
  })
})

describe('computeStageFrame', () => {
  test('aims between the person and the furniture', () => {
    const { target } = computeStageFrame(SOFA, LANDSCAPE, FRAME_OPTIONS)
    const [figureX] = computeFigurePosition(SOFA)

    expect(target[0]).toBeLessThan(0)
    expect(target[0]).toBeGreaterThan(figureX)
  })

  test.each([
    ['sofa', SOFA],
    ['fridge', FRIDGE],
    ['wardrobe', WARDROBE],
  ] as const)('keeps the %s and the person inside the picture', (_name, dimensions) => {
    const { distance, target } = computeStageFrame(dimensions, LANDSCAPE, FRAME_OPTIONS)
    const { horizontal, vertical } = halfAngles(LANDSCAPE)
    const [figureX] = computeFigurePosition(dimensions)
    const leftEdge = figureX - FIGURE_HALF_WIDTH_M
    const rightEdge = dimensions.widthM / 2
    const frontDistance = distance - dimensions.depthM / 2

    expect(Math.tan(horizontal) * frontDistance).toBeGreaterThanOrEqual(target[0] - leftEdge)
    expect(Math.tan(horizontal) * frontDistance).toBeGreaterThanOrEqual(rightEdge - target[0])
    expect(Math.tan(vertical) * frontDistance).toBeGreaterThanOrEqual(
      Math.max(dimensions.heightM, 1.7) - target[1],
    )
  })

  test('steps back on a portrait screen, where width is what runs out', () => {
    const landscape = computeStageFrame(SOFA, LANDSCAPE, FRAME_OPTIONS)
    const portrait = computeStageFrame(SOFA, PORTRAIT, FRAME_OPTIONS)

    expect(portrait.distance).toBeGreaterThan(landscape.distance)
  })

  test('steps back for bigger furniture', () => {
    const sofa = computeStageFrame(SOFA, LANDSCAPE, FRAME_OPTIONS)
    const wardrobe = computeStageFrame(WARDROBE, LANDSCAPE, FRAME_OPTIONS)

    expect(wardrobe.distance).toBeGreaterThan(sofa.distance)
  })
})
