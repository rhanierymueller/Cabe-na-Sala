import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box, roundedBox } from '../parts'

/** Geladeira inverse (freezer embaixo) — medidas típicas de mercado. */
export const DEFAULT_FRIDGE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 70,
  heightCm: 170,
  depthCm: 70,
}

const PLINTH_HEIGHT_RATIO = 0.025
const DOOR_THICKNESS_RATIO = 0.08
const FREEZER_HEIGHT_RATIO = 0.32
const DOOR_GAP_RATIO = 0.006
const DOOR_EDGE = 0.1
/** Puxador em barra chata, colado à borda da porta. */
const HANDLE_WIDTH_RATIO = 0.03
const HANDLE_DEPTH_RATIO = 0.035
const HANDLE_INSET_RATIO = 0.06
/** Visor do painel na porta de cima. */
const DISPLAY_WIDTH_RATIO = 0.22
const DISPLAY_HEIGHT_RATIO = 0.035

export function computeFridgeLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const plinthHeight = heightM * PLINTH_HEIGHT_RATIO
  const doorThickness = depthM * DOOR_THICKNESS_RATIO
  const bodyDepth = depthM - doorThickness
  const bodyHeight = heightM - plinthHeight
  const doorGap = heightM * DOOR_GAP_RATIO
  const freezerHeight = bodyHeight * FREEZER_HEIGHT_RATIO
  const mainDoorHeight = bodyHeight - freezerHeight - doorGap
  const doorZ = depthM / 2 - doorThickness / 2
  const freezerCenterY = plinthHeight + freezerHeight / 2
  const mainDoorCenterY = plinthHeight + freezerHeight + doorGap + mainDoorHeight / 2

  const handleWidth = widthM * HANDLE_WIDTH_RATIO
  const handleDepth = widthM * HANDLE_DEPTH_RATIO
  const handleX = -widthM / 2 + widthM * HANDLE_INSET_RATIO
  const handleZ = depthM / 2 + handleDepth / 2

  return [
    // Rodapé recuado
    box(
      [0, plinthHeight / 2, -doorThickness],
      [widthM * 0.94, plinthHeight, bodyDepth - doorThickness],
      MATERIALS.blackSteel,
    ),
    // Corpo (atrás das portas)
    roundedBox(
      [0, plinthHeight + bodyHeight / 2, -doorThickness / 2],
      [widthM, bodyHeight, bodyDepth],
      MATERIALS.graphite,
      0.03,
    ),
    // Porta da geladeira (em cima)
    roundedBox(
      [0, mainDoorCenterY, doorZ],
      [widthM, mainDoorHeight, doorThickness],
      MATERIALS.inox,
      DOOR_EDGE,
    ),
    // Gaveta do freezer (embaixo)
    roundedBox(
      [0, freezerCenterY, doorZ],
      [widthM, freezerHeight, doorThickness],
      MATERIALS.inox,
      DOOR_EDGE,
    ),
    // Puxadores em barra
    box(
      [handleX, mainDoorCenterY - mainDoorHeight * 0.12, handleZ],
      [handleWidth, mainDoorHeight * 0.55, handleDepth],
      MATERIALS.blackSteel,
    ),
    box(
      [0, freezerCenterY + freezerHeight * 0.36, handleZ],
      [widthM * 0.6, handleWidth, handleDepth],
      MATERIALS.blackSteel,
    ),
    // Visor
    box(
      [widthM * 0.12, mainDoorCenterY + mainDoorHeight * 0.3, depthM / 2],
      [widthM * DISPLAY_WIDTH_RATIO, heightM * DISPLAY_HEIGHT_RATIO, doorThickness * 0.06],
      MATERIALS.blackGlass,
    ),
  ]
}
