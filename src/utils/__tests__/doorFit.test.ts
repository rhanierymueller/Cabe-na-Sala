import { describe, expect, test } from 'vitest'
import { computeDoorFit } from '../doorFit'

const SOFA = { widthCm: 210, heightCm: 90, depthCm: 95 }

describe('computeDoorFit', () => {
  test('passes with room to spare when the smaller side fits well', () => {
    const fit = computeDoorFit(SOFA, 110)

    expect(fit.status).toBe('fits')
    expect(fit.gapCm).toBe(15)
  })

  test('uses the smaller horizontal side, not the furniture width', () => {
    const fit = computeDoorFit({ widthCm: 210, heightCm: 90, depthCm: 60 }, 70)

    expect(fit.status).toBe('fits')
    expect(fit.gapCm).toBe(10)
  })

  test('flags a tight fit when the gap is under the safety margin', () => {
    const fit = computeDoorFit(SOFA, 98)

    expect(fit.status).toBe('tight')
    expect(fit.gapCm).toBe(3)
  })

  test('blocks when the furniture is wider than the doorway', () => {
    const fit = computeDoorFit(SOFA, 88)

    expect(fit.status).toBe('blocked')
    expect(fit.gapCm).toBe(-7)
  })

  test('exact fit counts as tight, not blocked', () => {
    const fit = computeDoorFit(SOFA, 95)

    expect(fit.status).toBe('tight')
    expect(fit.gapCm).toBe(0)
  })

  test('keeps decimal precision in the gap', () => {
    const fit = computeDoorFit({ widthCm: 60.5, heightCm: 87, depthCm: 63 }, 62)

    expect(fit.gapCm).toBeCloseTo(1.5, 5)
    expect(fit.status).toBe('tight')
  })
})
