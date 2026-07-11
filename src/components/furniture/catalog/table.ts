import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { MATERIALS, box } from '../parts'

/** Mesa de jantar 4 lugares — medidas típicas de mercado. */
export const DEFAULT_TABLE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 120,
  heightCm: 78,
  depthCm: 80,
}

const TOP_THICKNESS_RATIO = 0.05
const LEG_THICKNESS_RATIO = 0.055
const LEG_INSET_RATIO = 0.06

export function computeTableLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const topThickness = heightM * TOP_THICKNESS_RATIO
  const legThickness = Math.min(widthM, depthM) * LEG_THICKNESS_RATIO
  const legHeight = heightM - topThickness
  const legOffsetX = widthM / 2 - legThickness / 2 - widthM * LEG_INSET_RATIO
  const legOffsetZ = depthM / 2 - legThickness / 2 - depthM * LEG_INSET_RATIO

  const legs = [-1, 1].flatMap((signX) =>
    [-1, 1].map(
      (signZ): FurniturePart =>
        box(
          [signX * legOffsetX, legHeight / 2, signZ * legOffsetZ],
          [legThickness, legHeight, legThickness],
          MATERIALS.woodDark,
        ),
    ),
  )

  return [
    ...legs,
    // Tampo
    box([0, heightM - topThickness / 2, 0], [widthM, topThickness, depthM], MATERIALS.wood),
  ]
}
