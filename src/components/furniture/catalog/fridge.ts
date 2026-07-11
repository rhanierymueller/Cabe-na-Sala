import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box, cylinder } from '../parts'

/** Geladeira duplex — medidas típicas de mercado. */
export const DEFAULT_FRIDGE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 70,
  heightCm: 170,
  depthCm: 70,
}

const FEET_HEIGHT_RATIO = 0.02
const DOOR_THICKNESS_RATIO = 0.06
const FREEZER_HEIGHT_RATIO = 0.28
const DOOR_GAP_RATIO = 0.008
const DOOR_WIDTH_RATIO = 0.97
const HANDLE_RADIUS_RATIO = 0.018
const HANDLE_STANDOFF_RATIO = 0.05
const HANDLE_INSET_RATIO = 0.12

export function computeFridgeLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const feetHeight = heightM * FEET_HEIGHT_RATIO
  const doorThickness = depthM * DOOR_THICKNESS_RATIO
  const bodyDepth = depthM - doorThickness
  const bodyHeight = heightM - feetHeight
  const doorGap = heightM * DOOR_GAP_RATIO
  const freezerHeight = bodyHeight * FREEZER_HEIGHT_RATIO
  const mainDoorHeight = bodyHeight - freezerHeight - doorGap
  const frontZ = depthM / 2 - doorThickness / 2
  const handleX = -widthM / 2 + widthM * HANDLE_INSET_RATIO
  const handleZ = depthM / 2 + widthM * HANDLE_STANDOFF_RATIO
  const handleRadius = widthM * HANDLE_RADIUS_RATIO

  const footThickness = widthM * 0.08
  const feet = [-1, 1].map((signX) =>
    box(
      [signX * (widthM / 2 - footThickness), feetHeight / 2, depthM * 0.3],
      [footThickness, feetHeight, footThickness],
      MATERIALS.darkSteel,
    ),
  )

  const freezerCenterY = feetHeight + mainDoorHeight + doorGap + freezerHeight / 2
  const mainDoorCenterY = feetHeight + mainDoorHeight / 2

  return [
    ...feet,
    // Corpo (atrás das portas)
    box(
      [0, feetHeight + bodyHeight / 2, -doorThickness / 2],
      [widthM, bodyHeight, bodyDepth],
      MATERIALS.graphite,
    ),
    // Porta do freezer (superior)
    box(
      [0, freezerCenterY, frontZ],
      [widthM * DOOR_WIDTH_RATIO, freezerHeight, doorThickness],
      MATERIALS.steel,
    ),
    // Porta principal (inferior)
    box(
      [0, mainDoorCenterY, frontZ],
      [widthM * DOOR_WIDTH_RATIO, mainDoorHeight, doorThickness],
      MATERIALS.steel,
    ),
    // Puxadores verticais
    cylinder(
      [handleX, freezerCenterY, handleZ],
      handleRadius,
      freezerHeight * 0.7,
      MATERIALS.chrome,
    ),
    cylinder(
      [handleX, mainDoorCenterY + mainDoorHeight * 0.15, handleZ],
      handleRadius,
      mainDoorHeight * 0.5,
      MATERIALS.chrome,
    ),
  ]
}
