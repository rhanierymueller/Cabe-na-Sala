import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { EDGE_PLUSH, MATERIALS, cylinder, roundedBox } from '../parts'

/** Sofá 3 lugares — medidas típicas de mercado. */
export const DEFAULT_SOFA_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 210,
  heightCm: 88,
  depthCm: 95,
}

const FEET_HEIGHT_RATIO = 0.1
const FOOT_RADIUS_RATIO = 0.018
const ARM_WIDTH_RATIO = 0.1
const ARM_HEIGHT_RATIO = 0.68
const BASE_HEIGHT_RATIO = 0.26
const BACKREST_DEPTH_RATIO = 0.2
const SEAT_CUSHION_HEIGHT_RATIO = 0.17
const SEAT_CUSHION_DEPTH_RATIO = 0.66
const BACK_CUSHION_HEIGHT_RATIO = 0.36
const BACK_CUSHION_DEPTH_RATIO = 0.17
const CUSHION_COUNT = 3
const CUSHION_GAP_RATIO = 0.008
const FRAME_EDGE = 0.22

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
  const seatHeight = heightM * SEAT_CUSHION_HEIGHT_RATIO
  const seatDepth = depthM * SEAT_CUSHION_DEPTH_RATIO
  const seatTop = feetHeight + baseHeight + seatHeight
  const backHeight = heightM * BACK_CUSHION_HEIGHT_RATIO
  const backDepth = depthM * BACK_CUSHION_DEPTH_RATIO

  const footRadius = Math.min(widthM, depthM) * FOOT_RADIUS_RATIO
  const feet = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      cylinder(
        [
          signX * (widthM / 2 - armWidth / 2),
          feetHeight / 2,
          signZ * (depthM / 2 - footRadius * 3),
        ],
        footRadius,
        feetHeight,
        MATERIALS.woodDark,
      ),
    ),
  )

  const cushionX = (index: number): number =>
    -innerWidth / 2 + cushionWidth / 2 + index * (cushionWidth + cushionGap)

  const seatCushions = Array.from({ length: CUSHION_COUNT }, (_, index): FurniturePart =>
    roundedBox(
      [cushionX(index), feetHeight + baseHeight + seatHeight / 2, depthM / 2 - seatDepth / 2],
      [cushionWidth, seatHeight, seatDepth],
      MATERIALS.fabricSeat,
      EDGE_PLUSH,
    ),
  )

  const backCushions = Array.from({ length: CUSHION_COUNT }, (_, index): FurniturePart =>
    roundedBox(
      [
        cushionX(index),
        seatTop + backHeight / 2 - seatHeight * 0.15,
        -depthM / 2 + backrestDepth + backDepth / 2,
      ],
      [cushionWidth, backHeight, backDepth],
      MATERIALS.fabricSeat,
      EDGE_PLUSH,
    ),
  )

  const arm = (signX: number): FurniturePart =>
    roundedBox(
      [signX * (widthM / 2 - armWidth / 2), feetHeight + armHeight / 2, 0],
      [armWidth, armHeight, depthM],
      MATERIALS.fabricDark,
      FRAME_EDGE,
    )

  return [
    ...feet,
    // Base estrutural entre os braços
    roundedBox(
      [0, feetHeight + baseHeight / 2, 0],
      [innerWidth, baseHeight, depthM * 0.97],
      MATERIALS.fabricDark,
    ),
    arm(-1),
    arm(1),
    // Encosto estrutural
    roundedBox(
      [0, feetHeight + (heightM - feetHeight) / 2, -depthM / 2 + backrestDepth / 2],
      [innerWidth + armWidth * 0.4, heightM - feetHeight, backrestDepth],
      MATERIALS.fabricDark,
      FRAME_EDGE,
    ),
    ...seatCushions,
    ...backCushions,
  ]
}
