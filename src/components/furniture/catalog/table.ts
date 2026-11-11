import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { MATERIALS, cylinder, roundedBox } from '../parts'

/** Mesa de jantar 4 lugares — medidas típicas de mercado. */
export const DEFAULT_TABLE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 120,
  heightCm: 78,
  depthCm: 80,
}

const TOP_THICKNESS_RATIO = 0.05
const APRON_HEIGHT_RATIO = 0.08
const APRON_INSET_RATIO = 0.1
const LEG_RADIUS_RATIO = 0.03
const LEG_INSET_RATIO = 0.07
const TOP_EDGE = 0.3

export function computeTableLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const topThickness = heightM * TOP_THICKNESS_RATIO
  const apronHeight = heightM * APRON_HEIGHT_RATIO
  const legRadius = Math.min(widthM, depthM) * LEG_RADIUS_RATIO
  const legHeight = heightM - topThickness
  const legOffsetX = widthM / 2 - legRadius - widthM * LEG_INSET_RATIO
  const legOffsetZ = depthM / 2 - legRadius - depthM * LEG_INSET_RATIO

  const legs = [-1, 1].flatMap((signX) =>
    [-1, 1].map(
      (signZ): FurniturePart =>
        cylinder(
          [signX * legOffsetX, legHeight / 2, signZ * legOffsetZ],
          legRadius,
          legHeight,
          MATERIALS.woodDark,
        ),
    ),
  )

  return [
    ...legs,
    // Saia sob o tampo
    roundedBox(
      [0, legHeight - apronHeight / 2, 0],
      [widthM * (1 - APRON_INSET_RATIO * 2), apronHeight, depthM * (1 - APRON_INSET_RATIO * 2)],
      MATERIALS.woodDark,
    ),
    // Tampo
    roundedBox(
      [0, heightM - topThickness / 2, 0],
      [widthM, topThickness, depthM],
      MATERIALS.wood,
      TOP_EDGE,
    ),
  ]
}
