import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box, roundedBox } from '../parts'

/** Guarda-roupa de portas de correr — medidas típicas de mercado. */
export const DEFAULT_WARDROBE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 150,
  heightCm: 200,
  depthCm: 55,
}

const PLINTH_HEIGHT_RATIO = 0.03
const DOOR_THICKNESS_RATIO = 0.05
const FRAME_MARGIN_RATIO = 0.012
const DOOR_COUNT = 3
/** A porta do meio é espelhada, como nos modelos de correr atuais. */
const MIRROR_DOOR_INDEX = 1
/** Perfil de alumínio preto entre as portas, que também serve de puxador. */
const PROFILE_WIDTH_RATIO = 0.012
const DOOR_EDGE = 0.06

export function computeWardrobeLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const plinthHeight = heightM * PLINTH_HEIGHT_RATIO
  const doorThickness = depthM * DOOR_THICKNESS_RATIO
  const bodyDepth = depthM - doorThickness
  const margin = heightM * FRAME_MARGIN_RATIO
  const profileWidth = widthM * PROFILE_WIDTH_RATIO
  const doorHeight = heightM - plinthHeight - margin * 2
  const frontsWidth = widthM - margin * 2
  const doorWidth = frontsWidth / DOOR_COUNT
  const doorCenterY = plinthHeight + margin + doorHeight / 2
  const frontZ = depthM / 2 - doorThickness / 2

  const doors = Array.from({ length: DOOR_COUNT }, (_, index) =>
    roundedBox(
      [-frontsWidth / 2 + doorWidth * (index + 0.5), doorCenterY, frontZ],
      [doorWidth - profileWidth, doorHeight, doorThickness],
      index === MIRROR_DOOR_INDEX ? MATERIALS.mirror : MATERIALS.lacquer,
      DOOR_EDGE,
    ),
  )
  const profiles = Array.from({ length: DOOR_COUNT + 1 }, (_, index) =>
    box(
      [-frontsWidth / 2 + doorWidth * index, doorCenterY, frontZ],
      [profileWidth, doorHeight, doorThickness * 0.9],
      MATERIALS.blackSteel,
    ),
  )

  return [
    // Rodapé recuado
    box(
      [0, plinthHeight / 2, -doorThickness],
      [widthM * 0.98, plinthHeight, bodyDepth - doorThickness],
      MATERIALS.blackSteel,
    ),
    // Corpo
    box(
      [0, plinthHeight + (heightM - plinthHeight) / 2, -doorThickness / 2],
      [widthM, heightM - plinthHeight, bodyDepth],
      MATERIALS.oak,
    ),
    // Fundo escuro do vão das portas: é a sombra que aparece nas frestas.
    box(
      [0, plinthHeight + (heightM - plinthHeight) / 2, frontZ],
      [widthM, heightM - plinthHeight, doorThickness * 0.5],
      MATERIALS.oakDark,
    ),
    ...doors,
    ...profiles,
  ]
}
