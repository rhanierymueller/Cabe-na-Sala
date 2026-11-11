import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { MATERIALS, box, roundedBox } from '../parts'

/** Mesa de jantar 4 lugares — medidas típicas de mercado. */
export const DEFAULT_TABLE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 120,
  heightCm: 78,
  depthCm: 80,
}

const TOP_THICKNESS_RATIO = 0.04
const TOP_EDGE = 0.35
/** Perfil quadrado de aço das pernas e da estrutura. */
const TUBE_RATIO = 0.045
const MAX_TUBE_M = 0.05
const FRAME_INSET_RATIO = 0.06

/** Tampo fino de madeira clara sobre estrutura de aço preto. */
export function computeTableLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const topThickness = heightM * TOP_THICKNESS_RATIO
  const tube = Math.min(MAX_TUBE_M, Math.min(widthM, depthM) * TUBE_RATIO)
  const legHeight = heightM - topThickness
  const legOffsetX = widthM / 2 - tube / 2 - widthM * FRAME_INSET_RATIO
  const legOffsetZ = depthM / 2 - tube / 2 - depthM * FRAME_INSET_RATIO
  const railY = legHeight - tube / 2

  const legs = [-1, 1].flatMap((signX) =>
    [-1, 1].map(
      (signZ): FurniturePart =>
        box(
          [signX * legOffsetX, legHeight / 2, signZ * legOffsetZ],
          [tube, legHeight, tube],
          MATERIALS.blackSteel,
        ),
    ),
  )
  // Travessas sob o tampo, fechando o quadro entre as pernas.
  const longRails = [-1, 1].map((signZ) =>
    box([0, railY, signZ * legOffsetZ], [legOffsetX * 2, tube, tube * 0.6], MATERIALS.blackSteel),
  )
  const shortRails = [-1, 1].map((signX) =>
    box([signX * legOffsetX, railY, 0], [tube * 0.6, tube, legOffsetZ * 2], MATERIALS.blackSteel),
  )

  return [
    ...legs,
    ...longRails,
    ...shortRails,
    roundedBox(
      [0, heightM - topThickness / 2, 0],
      [widthM, topThickness, depthM],
      MATERIALS.oak,
      TOP_EDGE,
    ),
  ]
}
