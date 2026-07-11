import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { MATERIALS, box } from '../parts'

/** Sofá 3 lugares — medidas típicas de mercado. */
export const DEFAULT_SOFA_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 210,
  heightCm: 88,
  depthCm: 95,
}

const FEET_HEIGHT_RATIO = 0.08
const ARM_WIDTH_RATIO = 0.12
const ARM_HEIGHT_RATIO = 0.72
const BASE_HEIGHT_RATIO = 0.3
const BACKREST_DEPTH_RATIO = 0.2
const SEAT_CUSHION_HEIGHT_RATIO = 0.16
const BACK_CUSHION_HEIGHT_RATIO = 0.34
const BACK_CUSHION_DEPTH_RATIO = 0.14
const CUSHION_COUNT = 3
const CUSHION_GAP_RATIO = 0.012

export function computeSofaLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const feetHeight = heightM * FEET_HEIGHT_RATIO
  const armWidth = widthM * ARM_WIDTH_RATIO
  const armHeight = heightM * ARM_HEIGHT_RATIO - feetHeight
  const baseHeight = heightM * BASE_HEIGHT_RATIO
  const backrestDepth = depthM * BACKREST_DEPTH_RATIO
  const innerWidth = widthM - 2 * armWidth
  const cushionGap = widthM * CUSHION_GAP_RATIO
  const cushionWidth = (innerWidth - cushionGap * (CUSHION_COUNT - 1)) / CUSHION_COUNT
  const seatTop = feetHeight + baseHeight + heightM * SEAT_CUSHION_HEIGHT_RATIO

  const footThickness = feetHeight * 0.6
  const feet = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      box(
        [
          signX * (widthM / 2 - armWidth / 2),
          feetHeight / 2,
          signZ * (depthM / 2 - footThickness),
        ],
        [footThickness, feetHeight, footThickness],
        MATERIALS.darkSteel,
      ),
    ),
  )

  const cushionX = (index: number): number =>
    -innerWidth / 2 + cushionWidth / 2 + index * (cushionWidth + cushionGap)

  const seatCushions = Array.from({ length: CUSHION_COUNT }, (_, index): FurniturePart =>
    box(
      [
        cushionX(index),
        feetHeight + baseHeight + (heightM * SEAT_CUSHION_HEIGHT_RATIO) / 2,
        depthM * 0.08,
      ],
      [cushionWidth, heightM * SEAT_CUSHION_HEIGHT_RATIO, depthM * 0.62],
      MATERIALS.fabricSeat,
    ),
  )

  const backCushions = Array.from({ length: CUSHION_COUNT }, (_, index): FurniturePart =>
    box(
      [
        cushionX(index),
        seatTop + (heightM * BACK_CUSHION_HEIGHT_RATIO) / 2,
        -depthM / 2 + backrestDepth + (depthM * BACK_CUSHION_DEPTH_RATIO) / 2,
      ],
      [cushionWidth, heightM * BACK_CUSHION_HEIGHT_RATIO, depthM * BACK_CUSHION_DEPTH_RATIO],
      MATERIALS.fabricSeat,
    ),
  )

  return [
    ...feet,
    // Base estrutural entre os braços
    box(
      [0, feetHeight + baseHeight / 2, 0],
      [innerWidth, baseHeight, depthM * 0.96],
      MATERIALS.fabricDark,
    ),
    // Braços
    box(
      [-(widthM / 2 - armWidth / 2), feetHeight + armHeight / 2, 0],
      [armWidth, armHeight, depthM],
      MATERIALS.fabricDark,
    ),
    box(
      [widthM / 2 - armWidth / 2, feetHeight + armHeight / 2, 0],
      [armWidth, armHeight, depthM],
      MATERIALS.fabricDark,
    ),
    // Encosto estrutural
    box(
      [0, feetHeight + (heightM - feetHeight) / 2, -depthM / 2 + backrestDepth / 2],
      [innerWidth, heightM - feetHeight, backrestDepth],
      MATERIALS.fabricDark,
    ),
    ...seatCushions,
    ...backCushions,
  ]
}
