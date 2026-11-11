import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout, FurniturePart } from '../parts'
import { FACING_FRONT, LYING_SIDEWAYS, MATERIALS, box, cylinder, roundedBox } from '../parts'

/** Fogão 4 bocas de piso — caso de teste oficial do projeto. */
export const DEFAULT_STOVE_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 60,
  heightCm: 87,
  depthCm: 63,
}

const FEET_HEIGHT_RATIO = 0.05
const PLINTH_RECESS_RATIO = 0.04
const COOKTOP_THICKNESS_RATIO = 0.03
const CONTROL_PANEL_HEIGHT_RATIO = 0.12
const BURNER_RADIUS_RATIO = 0.16
const BURNER_OFFSET_RATIO = 0.22
const BURNER_THICKNESS_RATIO = 0.012
/** Tampinha no centro de cada boca. */
const BURNER_CAP_RADIUS_RATIO = 0.45
const BURNER_CAP_HEIGHT_RATIO = 1.6
/** Grades de ferro: duas barras por lado, de frente a fundo, acima das bocas. */
const GRATE_BAR_THICKNESS_RATIO = 0.014
const GRATE_LENGTH_RATIO = 0.82
const GRATE_SPREAD_RATIO = 0.07
const DOOR_WIDTH_RATIO = 0.92
const DOOR_THICKNESS_RATIO = 0.03
/** A porta é quase toda de vidro preto, com uma moldura fina de inox. */
const WINDOW_WIDTH_RATIO = 0.9
const WINDOW_HEIGHT_RATIO = 0.8
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

  // Rodapé preto recuado no lugar dos pezinhos.
  const plinth = box(
    [0, feetHeight / 2, -depthM * PLINTH_RECESS_RATIO],
    [widthM * 0.94, feetHeight, depthM * (1 - PLINTH_RECESS_RATIO * 2)],
    MATERIALS.blackSteel,
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

  const burnerCaps = burners.map((burner) =>
    cylinder(
      [burner.position[0], heightM + burnerThickness * (1 + BURNER_CAP_HEIGHT_RATIO / 2), burner.position[2]],
      burnerRadius * BURNER_CAP_RADIUS_RATIO,
      burnerThickness * BURNER_CAP_HEIGHT_RATIO,
      MATERIALS.darkSteel,
    ),
  )

  const grateBar = widthM * GRATE_BAR_THICKNESS_RATIO
  const grateY = heightM + burnerThickness * (1 + BURNER_CAP_HEIGHT_RATIO) + grateBar / 2
  const grates = [-1, 1].flatMap((signX) =>
    [-1, 1].map((offset) =>
      box(
        [signX * widthM * BURNER_OFFSET_RATIO + offset * widthM * GRATE_SPREAD_RATIO, grateY, 0],
        [grateBar, grateBar, depthM * GRATE_LENGTH_RATIO],
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
      MATERIALS.chrome,
      FACING_FRONT,
    ),
  )

  const doorBottom = feetHeight
  const doorTop = heightM - cooktopThickness - panelHeight
  const doorHeight = doorTop - doorBottom
  const doorCenterY = doorBottom + doorHeight / 2

  return [
    plinth,
    roundedBox(
      [0, feetHeight + bodyHeight / 2, 0],
      [widthM, bodyHeight, depthM],
      MATERIALS.inox,
      0.03,
    ),
    roundedBox(
      [0, heightM - cooktopThickness / 2, 0],
      [widthM, cooktopThickness, depthM],
      MATERIALS.cooktop,
    ),
    ...burners,
    ...burnerCaps,
    ...grates,
    box(
      [0, heightM - cooktopThickness - panelHeight / 2, frontZ + doorThickness / 2],
      [widthM, panelHeight, doorThickness],
      MATERIALS.blackGlass,
    ),
    ...knobs,
    roundedBox(
      [0, doorCenterY, frontZ + doorThickness / 2],
      [widthM * DOOR_WIDTH_RATIO, doorHeight, doorThickness],
      MATERIALS.inox,
      0.15,
    ),
    box(
      [0, doorCenterY - doorHeight * 0.04, frontZ + doorThickness],
      [widthM * WINDOW_WIDTH_RATIO, doorHeight * WINDOW_HEIGHT_RATIO, doorThickness * 0.4],
      MATERIALS.blackGlass,
    ),
    cylinder(
      [0, doorTop - doorHeight * 0.055, frontZ + doorThickness + widthM * HANDLE_STANDOFF_RATIO],
      widthM * HANDLE_RADIUS_RATIO,
      widthM * HANDLE_LENGTH_RATIO,
      MATERIALS.chrome,
      LYING_SIDEWAYS,
    ),
  ]
}
