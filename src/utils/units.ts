import type { DimensionsCm, DimensionsMeters } from '../types/furniture'

export const CENTIMETERS_PER_METER = 100

export function centimetersToMeters(valueCm: number): number {
  return valueCm / CENTIMETERS_PER_METER
}

export function metersToCentimeters(valueM: number): number {
  return valueM * CENTIMETERS_PER_METER
}

export function dimensionsCmToMeters(dimensions: DimensionsCm): DimensionsMeters {
  return {
    widthM: centimetersToMeters(dimensions.widthCm),
    heightM: centimetersToMeters(dimensions.heightCm),
    depthM: centimetersToMeters(dimensions.depthCm),
  }
}
