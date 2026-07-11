import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box } from '../parts'

/**
 * Cama de casal queen — largura × altura da cabeceira × comprimento.
 * A profundidade aqui é o comprimento da cama (frente = pé da cama).
 */
export const DEFAULT_BED_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 158,
  heightCm: 110,
  depthCm: 198,
}

const HEADBOARD_THICKNESS_RATIO = 0.04
const BASE_HEIGHT_RATIO = 0.3
const MATTRESS_HEIGHT_RATIO = 0.18
const PILLOW_WIDTH_RATIO = 0.38
const PILLOW_DEPTH_RATIO = 0.13
const PILLOW_HEIGHT_RATIO = 0.07

export function computeBedLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const headboardThickness = depthM * HEADBOARD_THICKNESS_RATIO
  const baseHeight = heightM * BASE_HEIGHT_RATIO
  const mattressHeight = heightM * MATTRESS_HEIGHT_RATIO
  const bodyDepth = depthM - headboardThickness
  const bodyCenterZ = headboardThickness / 2
  const mattressTop = baseHeight + mattressHeight
  const pillowZ = -depthM / 2 + headboardThickness + depthM * PILLOW_DEPTH_RATIO

  return [
    // Cabeceira (fundo da cama, -z)
    box(
      [0, heightM / 2, -depthM / 2 + headboardThickness / 2],
      [widthM, heightM, headboardThickness],
      MATERIALS.wood,
    ),
    // Box/base
    box(
      [0, baseHeight / 2, bodyCenterZ],
      [widthM * 0.99, baseHeight, bodyDepth],
      MATERIALS.fabricDark,
    ),
    // Colchão
    box(
      [0, baseHeight + mattressHeight / 2, bodyCenterZ],
      [widthM * 0.96, mattressHeight, bodyDepth * 0.97],
      MATERIALS.mattress,
    ),
    // Travesseiros
    box(
      [-widthM * 0.23, mattressTop + (heightM * PILLOW_HEIGHT_RATIO) / 2, pillowZ],
      [widthM * PILLOW_WIDTH_RATIO, heightM * PILLOW_HEIGHT_RATIO, depthM * PILLOW_DEPTH_RATIO],
      MATERIALS.pillow,
    ),
    box(
      [widthM * 0.23, mattressTop + (heightM * PILLOW_HEIGHT_RATIO) / 2, pillowZ],
      [widthM * PILLOW_WIDTH_RATIO, heightM * PILLOW_HEIGHT_RATIO, depthM * PILLOW_DEPTH_RATIO],
      MATERIALS.pillow,
    ),
  ]
}
