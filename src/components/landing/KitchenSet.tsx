import { PartMesh } from '../furniture/FurnitureModel'
import type { FurnitureLayout, MaterialSpec } from '../furniture/parts'
import { box } from '../furniture/parts'

/**
 * Cozinha estilizada gerada por código: dois balcões com tampo, parede de
 * fundo e armário superior, flanqueando um vão vazio na origem — o palco
 * onde o fogão da história vai se encaixar.
 */

const CABINET: MaterialSpec = { color: '#4a4136', roughness: 0.75, metalness: 0.05 }
const COUNTERTOP: MaterialSpec = { color: '#9aa0a8', roughness: 0.4, metalness: 0.2 }
const WALL: MaterialSpec = { color: '#333944', roughness: 0.9, metalness: 0 }

/** Vão central — um pouco mais largo que o fogão de 60 cm da história. */
const GAP_WIDTH_M = 0.7
const CABINET_WIDTH_M = 0.9
const CABINET_HEIGHT_M = 0.9
const CABINET_DEPTH_M = 0.62
const COUNTERTOP_THICKNESS_M = 0.04
const COUNTERTOP_OVERHANG_M = 0.02
const WALL_WIDTH_M = 2.6
const WALL_HEIGHT_M = 1.7
const WALL_THICKNESS_M = 0.06
const UPPER_CABINET_HEIGHT_M = 0.45
const UPPER_CABINET_DEPTH_M = 0.34
const UPPER_CABINET_CENTER_Y_M = 1.5

const CABINET_CENTER_X = GAP_WIDTH_M / 2 + CABINET_WIDTH_M / 2
const WALL_CENTER_Z = -CABINET_DEPTH_M / 2 - WALL_THICKNESS_M / 2

const KITCHEN_LAYOUT: FurnitureLayout = [
  // Balcões inferiores
  box([-CABINET_CENTER_X, CABINET_HEIGHT_M / 2, 0], [CABINET_WIDTH_M, CABINET_HEIGHT_M, CABINET_DEPTH_M], CABINET),
  box([CABINET_CENTER_X, CABINET_HEIGHT_M / 2, 0], [CABINET_WIDTH_M, CABINET_HEIGHT_M, CABINET_DEPTH_M], CABINET),
  // Tampos de pedra
  box(
    [-CABINET_CENTER_X, CABINET_HEIGHT_M + COUNTERTOP_THICKNESS_M / 2, COUNTERTOP_OVERHANG_M / 2],
    [CABINET_WIDTH_M + COUNTERTOP_OVERHANG_M, COUNTERTOP_THICKNESS_M, CABINET_DEPTH_M + COUNTERTOP_OVERHANG_M],
    COUNTERTOP,
  ),
  box(
    [CABINET_CENTER_X, CABINET_HEIGHT_M + COUNTERTOP_THICKNESS_M / 2, COUNTERTOP_OVERHANG_M / 2],
    [CABINET_WIDTH_M + COUNTERTOP_OVERHANG_M, COUNTERTOP_THICKNESS_M, CABINET_DEPTH_M + COUNTERTOP_OVERHANG_M],
    COUNTERTOP,
  ),
  // Parede de fundo
  box([0, WALL_HEIGHT_M / 2, WALL_CENTER_Z], [WALL_WIDTH_M, WALL_HEIGHT_M, WALL_THICKNESS_M], WALL),
  // Armário superior
  box(
    [0, UPPER_CABINET_CENTER_Y_M, WALL_CENTER_Z + WALL_THICKNESS_M / 2 + UPPER_CABINET_DEPTH_M / 2],
    [WALL_WIDTH_M, UPPER_CABINET_HEIGHT_M, UPPER_CABINET_DEPTH_M],
    CABINET,
  ),
]

export function KitchenSet() {
  return (
    <group>
      {KITCHEN_LAYOUT.map((part, index) => (
        <PartMesh key={`kitchen-${index}`} part={part} />
      ))}
    </group>
  )
}
