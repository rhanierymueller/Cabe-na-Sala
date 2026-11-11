import { PartMesh } from '../furniture/FurnitureModel'
import type { FurnitureLayout, FurniturePart, MaterialSpec } from '../furniture/parts'
import { LYING_SIDEWAYS, box, cylinder, roundedBox } from '../furniture/parts'

/**
 * Cozinha gerada por código, inspirada na do print real da landing: balcões
 * com portas e gavetas, rodapé recuado, tampo de pedra clara, parede bege,
 * piso, armário superior e uma fita de LED quente embaixo dele. No meio fica o vão
 * vazio onde o fogão da história se encaixa.
 */

const CABINET: MaterialSpec = { color: '#756b5f', roughness: 0.7, metalness: 0.02 }
const CABINET_FRONT: MaterialSpec = { color: '#857a6d', roughness: 0.62, metalness: 0.02 }
const PLINTH: MaterialSpec = { color: '#1c1b1a', roughness: 0.8, metalness: 0 }
const COUNTERTOP: MaterialSpec = { color: '#a79e91', roughness: 0.5, metalness: 0.02 }
const WALL: MaterialSpec = { color: '#b9aa98', roughness: 0.9, metalness: 0 }
const HANDLE: MaterialSpec = { color: '#2a2b2e', roughness: 0.35, metalness: 0.7 }
const FLOOR: MaterialSpec = { color: '#5c5750', roughness: 0.6, metalness: 0 }
const LED_COLOR = '#ffd9a8'

/** Vão central — um pouco mais largo que o fogão de 60 cm da história. */
const GAP_WIDTH_M = 0.7
const CABINET_WIDTH_M = 0.9
const CABINET_HEIGHT_M = 0.9
const CABINET_DEPTH_M = 0.62
const PLINTH_HEIGHT_M = 0.1
const PLINTH_RECESS_M = 0.05
const FRONT_THICKNESS_M = 0.018
/** Folga entre portas e gavetas: a linha de sombra que dá cara de marcenaria. */
const REVEAL_M = 0.004
const COUNTERTOP_THICKNESS_M = 0.04
const COUNTERTOP_OVERHANG_M = 0.02
const WALL_WIDTH_M = 2.7
const WALL_HEIGHT_M = 1.95
const WALL_THICKNESS_M = 0.06
const UPPER_HEIGHT_M = 0.55
const UPPER_DEPTH_M = 0.34
const UPPER_BOTTOM_Y_M = 1.4
const UPPER_DOOR_COUNT = 5
const HANDLE_RADIUS_M = 0.006
const HANDLE_LENGTH_M = 0.16
const HANDLE_STANDOFF_M = 0.022
const DRAWER_COUNT = 3
const LED_HEIGHT_M = 0.012
const FLOOR_THICKNESS_M = 0.02
const FLOOR_DROP_M = 0.003
/** Da parede até um pouco à frente de onde o fogão começa a história. */
const FLOOR_DEPTH_M = 2
const LED_DEPTH_M = 0.03

const CABINET_CENTER_X = GAP_WIDTH_M / 2 + CABINET_WIDTH_M / 2
const CABINET_FRONT_Z = CABINET_DEPTH_M / 2
const WALL_FRONT_Z = -CABINET_DEPTH_M / 2
const CARCASS_HEIGHT_M = CABINET_HEIGHT_M - PLINTH_HEIGHT_M
const CARCASS_CENTER_Y = PLINTH_HEIGHT_M + CARCASS_HEIGHT_M / 2
const UPPER_CENTER_Z = WALL_FRONT_Z + UPPER_DEPTH_M / 2
const UPPER_FRONT_Z = WALL_FRONT_Z + UPPER_DEPTH_M
const FLOOR_CENTER_Z = WALL_FRONT_Z + FLOOR_DEPTH_M / 2

function handle(x: number, y: number, frontZ: number): FurniturePart {
  return cylinder([x, y, frontZ + HANDLE_STANDOFF_M], HANDLE_RADIUS_M, HANDLE_LENGTH_M, HANDLE, LYING_SIDEWAYS)
}

/** Frente (porta ou gaveta) já descontando a folga em volta. */
function front(x: number, y: number, widthM: number, heightM: number, frontZ: number): FurniturePart {
  return roundedBox(
    [x, y, frontZ + FRONT_THICKNESS_M / 2],
    [widthM - REVEAL_M * 2, heightM - REVEAL_M * 2, FRONT_THICKNESS_M],
    CABINET_FRONT,
    0.12,
  )
}

/** Corpo, rodapé recuado e tampo de um balcão. */
function lowerCabinet(centerX: number): FurniturePart[] {
  return [
    box([centerX, CARCASS_CENTER_Y, 0], [CABINET_WIDTH_M, CARCASS_HEIGHT_M, CABINET_DEPTH_M], CABINET),
    box(
      [centerX, PLINTH_HEIGHT_M / 2, -PLINTH_RECESS_M / 2],
      [CABINET_WIDTH_M, PLINTH_HEIGHT_M, CABINET_DEPTH_M - PLINTH_RECESS_M],
      PLINTH,
    ),
    roundedBox(
      [centerX, CABINET_HEIGHT_M + COUNTERTOP_THICKNESS_M / 2, COUNTERTOP_OVERHANG_M / 2],
      [CABINET_WIDTH_M, COUNTERTOP_THICKNESS_M, CABINET_DEPTH_M + COUNTERTOP_OVERHANG_M],
      COUNTERTOP,
      0.2,
    ),
  ]
}

/** Balcão da esquerda: duas portas. */
function doorFronts(centerX: number): FurniturePart[] {
  const doorWidth = CABINET_WIDTH_M / 2
  return [-1, 1].flatMap((side) => {
    const x = centerX + (side * doorWidth) / 2
    return [
      front(x, CARCASS_CENTER_Y, doorWidth, CARCASS_HEIGHT_M, CABINET_FRONT_Z),
      // Puxador no canto de cima, do lado em que a porta abre.
      handle(x - side * (doorWidth / 2 - 0.11), PLINTH_HEIGHT_M + CARCASS_HEIGHT_M - 0.06, CABINET_FRONT_Z),
    ]
  })
}

/** Balcão da direita: gaveteiro, como o da cozinha do print. */
function drawerFronts(centerX: number): FurniturePart[] {
  const drawerHeight = CARCASS_HEIGHT_M / DRAWER_COUNT
  return Array.from({ length: DRAWER_COUNT }, (_, index) => {
    const y = PLINTH_HEIGHT_M + drawerHeight * (index + 0.5)
    return [
      front(centerX, y, CABINET_WIDTH_M, drawerHeight, CABINET_FRONT_Z),
      handle(centerX, y + drawerHeight / 2 - 0.05, CABINET_FRONT_Z),
    ]
  }).flat()
}

function upperCabinets(): FurniturePart[] {
  const doorWidth = WALL_WIDTH_M / UPPER_DOOR_COUNT
  const centerY = UPPER_BOTTOM_Y_M + UPPER_HEIGHT_M / 2
  const doors = Array.from({ length: UPPER_DOOR_COUNT }, (_, index) =>
    front(-WALL_WIDTH_M / 2 + doorWidth * (index + 0.5), centerY, doorWidth, UPPER_HEIGHT_M, UPPER_FRONT_Z),
  )
  return [box([0, centerY, UPPER_CENTER_Z], [WALL_WIDTH_M, UPPER_HEIGHT_M, UPPER_DEPTH_M], CABINET), ...doors]
}

const KITCHEN_LAYOUT: FurnitureLayout = [
  box(
    [0, WALL_HEIGHT_M / 2, WALL_FRONT_Z - WALL_THICKNESS_M / 2],
    [WALL_WIDTH_M, WALL_HEIGHT_M, WALL_THICKNESS_M],
    WALL,
  ),
  ...lowerCabinet(-CABINET_CENTER_X),
  ...lowerCabinet(CABINET_CENTER_X),
  ...doorFronts(-CABINET_CENTER_X),
  ...drawerFronts(CABINET_CENTER_X),
  ...upperCabinets(),
  // Piso do canto da cozinha; o topo fica um fio abaixo de zero para não brigar com a grade.
  box(
    [0, -FLOOR_THICKNESS_M / 2 - FLOOR_DROP_M, FLOOR_CENTER_Z],
    [WALL_WIDTH_M, FLOOR_THICKNESS_M, FLOOR_DEPTH_M],
    FLOOR,
  ),
]

const LED_Y = UPPER_BOTTOM_Y_M - LED_HEIGHT_M / 2
const LED_Z = WALL_FRONT_Z + LED_DEPTH_M
/** Vários pontos fracos em vez de poucos fortes: a parede fica lavada de luz, sem manchas. */
const LED_LIGHT_XS = [-1.05, -0.63, -0.21, 0.21, 0.63, 1.05] as const

export function KitchenSet() {
  return (
    <group>
      {KITCHEN_LAYOUT.map((part, index) => (
        <PartMesh key={`kitchen-${index}`} part={part} />
      ))}

      {/* Fita de LED sob o armário: a faixa acesa e a luz quente que ela joga na parede e no tampo. */}
      <mesh position={[0, LED_Y, LED_Z]}>
        <boxGeometry args={[WALL_WIDTH_M - 0.1, LED_HEIGHT_M, LED_DEPTH_M]} />
        <meshBasicMaterial color={LED_COLOR} toneMapped={false} />
      </mesh>
      {LED_LIGHT_XS.map((x) => (
        <pointLight
          key={x}
          position={[x, UPPER_BOTTOM_Y_M - 0.08, LED_Z + 0.08]}
          color={LED_COLOR}
          intensity={0.5}
          distance={1.8}
          decay={2}
        />
      ))}
    </group>
  )
}
