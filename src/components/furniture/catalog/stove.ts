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
const PLINTH_WIDTH_RATIO = 0.94
const BODY_EDGE_RATIO = 0.03
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
const DOOR_EDGE_RATIO = 0.15
/** A porta é quase toda de vidro preto, com uma moldura fina de inox. */
const WINDOW_WIDTH_RATIO = 0.9
const WINDOW_HEIGHT_RATIO = 0.8
/** O visor fica um pouco abaixo do centro da porta, abrindo espaço para o puxador. */
const WINDOW_DROP_RATIO = 0.04
const WINDOW_THICKNESS_RATIO = 0.4
const HANDLE_LENGTH_RATIO = 0.8
const HANDLE_RADIUS_RATIO = 0.018
const HANDLE_STANDOFF_RATIO = 0.06
const HANDLE_DROP_RATIO = 0.055
const KNOB_COUNT = 4
const KNOB_RADIUS_RATIO = 0.045
const KNOB_LENGTH_RATIO = 0.03
/** Os botões ocupam o miolo do painel, longe das quinas. */
const KNOBS_SPAN_RATIO = 0.7

/** Medidas derivadas que as três partes do fogão usam. */
interface StoveFrame extends DimensionsMeters {
  readonly feetHeight: number
  readonly cooktopThickness: number
  readonly panelHeight: number
  readonly frontZ: number
  readonly doorThickness: number
}

function measureStove(dimensions: DimensionsMeters): StoveFrame {
  return {
    ...dimensions,
    feetHeight: dimensions.heightM * FEET_HEIGHT_RATIO,
    cooktopThickness: dimensions.heightM * COOKTOP_THICKNESS_RATIO,
    panelHeight: dimensions.heightM * CONTROL_PANEL_HEIGHT_RATIO,
    frontZ: dimensions.depthM / 2,
    doorThickness: dimensions.widthM * DOOR_THICKNESS_RATIO,
  }
}

/** Rodapé preto recuado no lugar dos pezinhos, corpo de inox e tampo. */
function stoveBody({ widthM, heightM, depthM, feetHeight, cooktopThickness }: StoveFrame): FurniturePart[] {
  const bodyHeight = heightM - feetHeight - cooktopThickness
  return [
    box(
      [0, feetHeight / 2, -depthM * PLINTH_RECESS_RATIO],
      [widthM * PLINTH_WIDTH_RATIO, feetHeight, depthM * (1 - PLINTH_RECESS_RATIO * 2)],
      MATERIALS.blackSteel,
    ),
    roundedBox(
      [0, feetHeight + bodyHeight / 2, 0],
      [widthM, bodyHeight, depthM],
      MATERIALS.inox,
      BODY_EDGE_RATIO,
    ),
    roundedBox([0, heightM - cooktopThickness / 2, 0], [widthM, cooktopThickness, depthM], MATERIALS.cooktop),
  ]
}

/** Quatro bocas com tampinha e as grades de ferro por cima. */
function stoveCooktop({ widthM, heightM, depthM }: StoveFrame): FurniturePart[] {
  const burnerRadius = Math.min(widthM, depthM) * BURNER_RADIUS_RATIO
  const burnerThickness = heightM * BURNER_THICKNESS_RATIO
  const burners = [-1, 1].flatMap((signX) =>
    [-1, 1].map((signZ) =>
      cylinder(
        [signX * widthM * BURNER_OFFSET_RATIO, heightM + burnerThickness / 2, signZ * depthM * BURNER_OFFSET_RATIO],
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

  return [...burners, ...burnerCaps, ...grates]
}

/** Painel de vidro com os botões, porta de inox com visor preto e puxador. */
function stoveFront(frame: StoveFrame): FurniturePart[] {
  const { widthM, heightM, feetHeight, cooktopThickness, panelHeight, frontZ, doorThickness } = frame

  const knobY = heightM - cooktopThickness - panelHeight / 2
  const knobRadius = widthM * KNOB_RADIUS_RATIO
  const knobLength = widthM * KNOB_LENGTH_RATIO
  const knobsUsableWidth = widthM * KNOBS_SPAN_RATIO
  const knobSpacing = knobsUsableWidth / (KNOB_COUNT - 1)
  const knobs = Array.from({ length: KNOB_COUNT }, (_, index): FurniturePart =>
    cylinder(
      [-knobsUsableWidth / 2 + index * knobSpacing, knobY, frontZ + doorThickness + knobLength / 2],
      knobRadius,
      knobLength,
      MATERIALS.chrome,
      FACING_FRONT,
    ),
  )

  const doorTop = heightM - cooktopThickness - panelHeight
  const doorHeight = doorTop - feetHeight
  const doorCenterY = feetHeight + doorHeight / 2

  return [
    box([0, knobY, frontZ + doorThickness / 2], [widthM, panelHeight, doorThickness], MATERIALS.blackGlass),
    ...knobs,
    roundedBox(
      [0, doorCenterY, frontZ + doorThickness / 2],
      [widthM * DOOR_WIDTH_RATIO, doorHeight, doorThickness],
      MATERIALS.inox,
      DOOR_EDGE_RATIO,
    ),
    box(
      [0, doorCenterY - doorHeight * WINDOW_DROP_RATIO, frontZ + doorThickness],
      [widthM * WINDOW_WIDTH_RATIO, doorHeight * WINDOW_HEIGHT_RATIO, doorThickness * WINDOW_THICKNESS_RATIO],
      MATERIALS.blackGlass,
    ),
    cylinder(
      [0, doorTop - doorHeight * HANDLE_DROP_RATIO, frontZ + doorThickness + widthM * HANDLE_STANDOFF_RATIO],
      widthM * HANDLE_RADIUS_RATIO,
      widthM * HANDLE_LENGTH_RATIO,
      MATERIALS.chrome,
      LYING_SIDEWAYS,
    ),
  ]
}

export function computeStoveLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const frame = measureStove(dimensions)
  return [...stoveBody(frame), ...stoveCooktop(frame), ...stoveFront(frame)]
}
