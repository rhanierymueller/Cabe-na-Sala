import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { EDGE_PLUSH, MATERIALS, cylinder, roundedBox } from '../parts'

/**
 * Cama de casal queen — largura × altura da cabeceira × comprimento.
 * A profundidade aqui é o comprimento da cama (frente = pé da cama).
 */
export const DEFAULT_BED_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 158,
  heightCm: 110,
  depthCm: 198,
}

const HEADBOARD_THICKNESS_RATIO = 0.045
const FEET_HEIGHT_RATIO = 0.07
const FOOT_RADIUS_RATIO = 0.018
const BASE_HEIGHT_RATIO = 0.2
const MATTRESS_HEIGHT_RATIO = 0.2
const PILLOW_WIDTH_RATIO = 0.4
const PILLOW_DEPTH_RATIO = 0.19
const PILLOW_HEIGHT_RATIO = 0.09
const DUVET_LENGTH_RATIO = 0.62
const DUVET_THICKNESS_RATIO = 0.035
const HEADBOARD_EDGE = 0.3

export function computeBedLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const headboardThickness = depthM * HEADBOARD_THICKNESS_RATIO
  const feetHeight = heightM * FEET_HEIGHT_RATIO
  const baseHeight = heightM * BASE_HEIGHT_RATIO
  const mattressHeight = heightM * MATTRESS_HEIGHT_RATIO
  const bodyDepth = depthM - headboardThickness
  const bodyCenterZ = headboardThickness / 2
  const mattressBottom = feetHeight + baseHeight
  const mattressTop = mattressBottom + mattressHeight
  const mattressWidth = widthM * 0.97
  const mattressDepth = bodyDepth * 0.98
  const pillowHeight = heightM * PILLOW_HEIGHT_RATIO
  const pillowDepth = depthM * PILLOW_DEPTH_RATIO
  const pillowZ = -depthM / 2 + headboardThickness + pillowDepth * 0.62
  const duvetLength = mattressDepth * DUVET_LENGTH_RATIO
  const duvetThickness = heightM * DUVET_THICKNESS_RATIO

  const footRadius = widthM * FOOT_RADIUS_RATIO
  const feet = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      cylinder(
        [
          signX * (widthM / 2 - footRadius * 3),
          feetHeight / 2,
          bodyCenterZ + signZ * (bodyDepth / 2 - footRadius * 3),
        ],
        footRadius,
        feetHeight,
        MATERIALS.woodDark,
      ),
    ),
  )

  const pillow = (signX: number): FurniturePart =>
    roundedBox(
      [signX * widthM * 0.235, mattressTop + pillowHeight * 0.42, pillowZ],
      [widthM * PILLOW_WIDTH_RATIO, pillowHeight, pillowDepth],
      MATERIALS.pillow,
      0.5,
    )

  return [
    ...feet,
    // Cabeceira estofada (fundo da cama, -z)
    roundedBox(
      [0, heightM / 2, -depthM / 2 + headboardThickness / 2],
      [widthM, heightM, headboardThickness],
      MATERIALS.fabricDark,
      HEADBOARD_EDGE,
    ),
    // Base
    roundedBox(
      [0, feetHeight + baseHeight / 2, bodyCenterZ],
      [widthM * 0.99, baseHeight, bodyDepth],
      MATERIALS.fabricDark,
    ),
    // Colchão
    roundedBox(
      [0, mattressBottom + mattressHeight / 2, bodyCenterZ],
      [mattressWidth, mattressHeight, mattressDepth],
      MATERIALS.mattress,
      EDGE_PLUSH,
    ),
    // Edredom cobrindo os pés da cama
    roundedBox(
      [0, mattressTop - mattressHeight * 0.28, depthM / 2 - duvetLength / 2 - mattressDepth * 0.005],
      [widthM * 0.995, mattressHeight * 0.62 + duvetThickness, duvetLength],
      MATERIALS.duvet,
      EDGE_PLUSH,
    ),
    pillow(-1),
    pillow(1),
  ]
}
