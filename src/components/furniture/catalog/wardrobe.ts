import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box, cylinder } from '../parts'

/** Guarda-roupa 2 portas — medidas típicas de mercado. */
export const DEFAULT_WARDROBE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 150,
  heightCm: 200,
  depthCm: 55,
}

const PLINTH_HEIGHT_RATIO = 0.04
const DOOR_THICKNESS_RATIO = 0.05
const DOOR_MARGIN_RATIO = 0.03
const DOOR_SEAM_RATIO = 0.006
const HANDLE_RADIUS_RATIO = 0.008
const HANDLE_LENGTH_RATIO = 0.12
const HANDLE_STANDOFF_RATIO = 0.02

export function computeWardrobeLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const plinthHeight = heightM * PLINTH_HEIGHT_RATIO
  const doorThickness = depthM * DOOR_THICKNESS_RATIO
  const bodyDepth = depthM - doorThickness
  const doorMargin = widthM * DOOR_MARGIN_RATIO
  const doorSeam = widthM * DOOR_SEAM_RATIO
  const doorHeight = heightM - plinthHeight - doorMargin * 2
  const doorWidth = (widthM - doorMargin * 2 - doorSeam) / 2
  const doorCenterY = plinthHeight + doorMargin + doorHeight / 2
  const frontZ = depthM / 2 - doorThickness / 2
  const handleY = doorCenterY
  const handleZ = depthM / 2 + heightM * HANDLE_STANDOFF_RATIO

  return [
    // Rodapé
    box([0, plinthHeight / 2, 0], [widthM * 0.96, plinthHeight, bodyDepth], MATERIALS.woodDark),
    // Corpo
    box(
      [0, plinthHeight + (heightM - plinthHeight) / 2, -doorThickness / 2],
      [widthM, heightM - plinthHeight, bodyDepth],
      MATERIALS.woodDark,
    ),
    // Portas
    box(
      [-(doorSeam / 2 + doorWidth / 2), doorCenterY, frontZ],
      [doorWidth, doorHeight, doorThickness],
      MATERIALS.wood,
    ),
    box(
      [doorSeam / 2 + doorWidth / 2, doorCenterY, frontZ],
      [doorWidth, doorHeight, doorThickness],
      MATERIALS.wood,
    ),
    // Puxadores verticais junto à fresta central
    cylinder(
      [-doorSeam / 2 - widthM * 0.04, handleY, handleZ],
      heightM * HANDLE_RADIUS_RATIO,
      heightM * HANDLE_LENGTH_RATIO,
      MATERIALS.chrome,
    ),
    cylinder(
      [doorSeam / 2 + widthM * 0.04, handleY, handleZ],
      heightM * HANDLE_RADIUS_RATIO,
      heightM * HANDLE_LENGTH_RATIO,
      MATERIALS.chrome,
    ),
  ]
}
