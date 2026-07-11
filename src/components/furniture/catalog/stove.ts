import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { FACING_FRONT, LYING_SIDEWAYS, MATERIALS, box, cylinder } from '../parts'

/** Fogão 4 bocas de piso — caso de teste oficial do projeto. */
export const DEFAULT_STOVE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 60,
  heightCm: 87,
  depthCm: 63,
}

const FEET_HEIGHT_RATIO = 0.05
const FEET_THICKNESS_RATIO = 0.08
const COOKTOP_THICKNESS_RATIO = 0.03
const CONTROL_PANEL_HEIGHT_RATIO = 0.12
const BURNER_RADIUS_RATIO = 0.16
const BURNER_OFFSET_RATIO = 0.22
const BURNER_THICKNESS_RATIO = 0.012
const DOOR_WIDTH_RATIO = 0.92
const DOOR_THICKNESS_RATIO = 0.03
const WINDOW_WIDTH_RATIO = 0.7
const WINDOW_HEIGHT_RATIO = 0.45
const HANDLE_LENGTH_RATIO = 0.8
const HANDLE_RADIUS_RATIO = 0.018
const HANDLE_STANDOFF_RATIO = 0.06
const KNOB_COUNT = 4
const KNOB_RADIUS_RATIO = 0.045
const KNOB_LENGTH_RATIO = 0.03

export function computeStoveLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const feetHeight = heightM * FEET_HEIGHT_RATIO
  const cooktopThickness = heightM * COOKTOP_THICKNESS_RATIO
  const panelHeight = heightM * CONTROL_PANEL_HEIGHT_RATIO
  const bodyHeight = heightM - feetHeight - cooktopThickness
  const frontZ = depthM / 2
  const doorThickness = widthM * DOOR_THICKNESS_RATIO

  const footThickness = Math.min(widthM, depthM) * FEET_THICKNESS_RATIO
  const feet = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      box(
        [
          signX * (widthM / 2 - footThickness / 2),
          feetHeight / 2,
          signZ * (depthM / 2 - footThickness / 2),
        ],
        [footThickness, feetHeight, footThickness],
        MATERIALS.darkSteel,
      ),
    ),
  )

  const burnerRadius = Math.min(widthM, depthM) * BURNER_RADIUS_RATIO
  const burnerThickness = heightM * BURNER_THICKNESS_RATIO
  const burners = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      cylinder(
        [
          signX * widthM * BURNER_OFFSET_RATIO,
          heightM + burnerThickness / 2,
          signZ * depthM * BURNER_OFFSET_RATIO,
        ],
        burnerRadius,
        burnerThickness,
        MATERIALS.burner,
      ),
    ),
  )

  const knobY = heightM - cooktopThickness - panelHeight / 2
  const knobRadius = widthM * KNOB_RADIUS_RATIO
  const knobLength = widthM * KNOB_LENGTH_RATIO
  const knobsUsableWidth = widthM * 0.7
  const knobSpacing = knobsUsableWidth / (KNOB_COUNT - 1)
  const knobs = Array.from({ length: KNOB_COUNT }, (_, index): FurniturePart =>
    cylinder(
      [
        -knobsUsableWidth / 2 + index * knobSpacing,
        knobY,
        frontZ + doorThickness + knobLength / 2,
      ],
      knobRadius,
      knobLength,
      MATERIALS.darkSteel,
      FACING_FRONT,
    ),
  )

  const doorBottom = feetHeight
  const doorTop = heightM - cooktopThickness - panelHeight
  const doorHeight = doorTop - doorBottom
  const doorCenterY = doorBottom + doorHeight / 2

  return [
    ...feet,
    box([0, feetHeight + bodyHeight / 2, 0], [widthM, bodyHeight, depthM], MATERIALS.steel),
    box(
      [0, heightM - cooktopThickness / 2, 0],
      [widthM, cooktopThickness, depthM],
      MATERIALS.cooktop,
    ),
    ...burners,
    box(
      [0, heightM - cooktopThickness - panelHeight / 2, frontZ + doorThickness / 2],
      [widthM, panelHeight, doorThickness],
      MATERIALS.steel,
    ),
    ...knobs,
    box(
      [0, doorCenterY, frontZ + doorThickness / 2],
      [widthM * DOOR_WIDTH_RATIO, doorHeight, doorThickness],
      MATERIALS.steel,
    ),
    box(
      [0, doorCenterY, frontZ + doorThickness],
      [widthM * WINDOW_WIDTH_RATIO, doorHeight * WINDOW_HEIGHT_RATIO, doorThickness * 0.4],
      MATERIALS.glass,
    ),
    cylinder(
      [0, doorTop - doorHeight * 0.08, frontZ + doorThickness + widthM * HANDLE_STANDOFF_RATIO],
      widthM * HANDLE_RADIUS_RATIO,
      widthM * HANDLE_LENGTH_RATIO,
      MATERIALS.chrome,
      LYING_SIDEWAYS,
    ),
  ]
}
