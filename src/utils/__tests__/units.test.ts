import { describe, expect, test } from 'vitest'
import { centimetersToMeters, dimensionsCmToMeters, metersToCentimeters } from '../units'

describe('centimetersToMeters', () => {
  test('converts whole centimeters to meters', () => {
    expect(centimetersToMeters(60)).toBe(0.6)
  })

  test('converts fractional centimeters to meters', () => {
    expect(centimetersToMeters(87.5)).toBe(0.875)
  })
})

describe('metersToCentimeters', () => {
  test('converts meters back to centimeters', () => {
    expect(metersToCentimeters(0.63)).toBe(63)
  })
})

describe('dimensionsCmToMeters', () => {
  test('converts all axes without mutating the input', () => {
    // Arrange
    const dimensionsCm = { widthCm: 60, heightCm: 87, depthCm: 63 }

    // Act
    const dimensionsM = dimensionsCmToMeters(dimensionsCm)

    // Assert
    expect(dimensionsM).toEqual({ widthM: 0.6, heightM: 0.87, depthM: 0.63 })
    expect(dimensionsCm).toEqual({ widthCm: 60, heightCm: 87, depthCm: 63 })
  })
})
