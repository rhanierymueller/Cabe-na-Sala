import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box, cylinder, roundedBox } from '../parts'

/**
 * Móvel baixo genérico: serve para rack, cômoda, aparador, buffet e
 * criado-mudo. É o destino de tudo que não tem modelo próprio no catálogo.
 */
export const DEFAULT_CABINET_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 180,
  heightCm: 55,
  depthCm: 40,
}

const LEG_HEIGHT_RATIO = 0.2
const MAX_LEG_HEIGHT_M = 0.16
const LEG_RADIUS_M = 0.014
const LEG_INSET_RATIO = 0.07
const FRONT_THICKNESS_RATIO = 0.045
const FRAME_MARGIN_RATIO = 0.035
/** Fresta entre as frentes, relativa à altura do corpo. */
const REVEAL_RATIO = 0.012
/** Largura que cada porta tenta ter; o número de portas sai daí. */
const TARGET_DOOR_WIDTH_M = 0.48
const MIN_DOORS = 1
const MAX_DOORS = 6

export function computeCabinetLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const legHeight = Math.min(heightM * LEG_HEIGHT_RATIO, MAX_LEG_HEIGHT_M)
  const bodyHeight = heightM - legHeight
  const bodyCenterY = legHeight + bodyHeight / 2
  const frontThickness = depthM * FRONT_THICKNESS_RATIO
  const bodyDepth = depthM - frontThickness
  const margin = bodyHeight * FRAME_MARGIN_RATIO
  const reveal = bodyHeight * REVEAL_RATIO

  const legRadius = Math.min(LEG_RADIUS_M, widthM * 0.03)
  const legs = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      cylinder(
        [
          signX * (widthM / 2 - widthM * LEG_INSET_RATIO),
          legHeight / 2,
          signZ * (depthM / 2 - depthM * 0.14),
        ],
        legRadius,
        legHeight,
        MATERIALS.blackSteel,
      ),
    ),
  )

  const doorCount = Math.min(MAX_DOORS, Math.max(MIN_DOORS, Math.round(widthM / TARGET_DOOR_WIDTH_M)))
  const frontsWidth = widthM - margin * 2
  const doorWidth = frontsWidth / doorCount
  const doors = Array.from({ length: doorCount }, (_, index) =>
    roundedBox(
      [-frontsWidth / 2 + doorWidth * (index + 0.5), bodyCenterY, depthM / 2 - frontThickness / 2],
      [doorWidth - reveal, bodyHeight - margin * 2, frontThickness],
      MATERIALS.lacquer,
      0.1,
    ),
  )

  return [
    ...legs,
    // Corpo em madeira clara; as frentes laqueadas ficam embutidas na moldura.
    box([0, bodyCenterY, -frontThickness / 2], [widthM, bodyHeight, bodyDepth], MATERIALS.oak),
    box(
      [0, bodyCenterY, depthM / 2 - frontThickness / 2],
      [widthM, bodyHeight, frontThickness * 0.5],
      MATERIALS.oakDark,
    ),
    ...doors,
  ]
}
