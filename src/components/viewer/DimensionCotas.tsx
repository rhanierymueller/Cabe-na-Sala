import { Html, Line } from '@react-three/drei'
import type { DimensionsMeters } from '../../types/furniture'
import { metersToCentimeters } from '../../utils/units'

interface DimensionCotasProps {
  readonly dimensions: DimensionsMeters
}

type Point = readonly [number, number, number]

const COTA_COLOR = '#f5f5f7'
const COTA_LINE_WIDTH = 1.2
/** Distância entre a cota e o móvel. */
const OFFSET_M = 0.14
/** Meio comprimento do tracinho nas pontas da cota. */
const TICK_M = 0.045
/** Um fio acima do chão para não brigar com a grade. */
const FLOOR_LIFT_M = 0.004

interface Cota {
  readonly key: string
  readonly from: Point
  readonly to: Point
  /** Direção dos tracinhos das pontas (perpendicular à cota). */
  readonly tick: Point
  readonly valueM: number
}

function offsetPoint(point: Point, direction: Point, amount: number): [number, number, number] {
  return [
    point[0] + direction[0] * amount,
    point[1] + direction[1] * amount,
    point[2] + direction[2] * amount,
  ]
}

function midpoint(from: Point, to: Point): [number, number, number] {
  return [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]
}

/**
 * Cotas de desenho técnico em volta do móvel: largura e profundidade no
 * chão, altura em pé na quina. Mostram direto a medida digitada: o modelo
 * anima até elas, e as linhas não são recriadas a cada quadro da animação.
 */
export function DimensionCotas({ dimensions }: DimensionCotasProps) {
  const halfWidth = dimensions.widthM / 2
  const halfDepth = dimensions.depthM / 2
  const frontZ = halfDepth + OFFSET_M
  const sideX = halfWidth + OFFSET_M

  const cotas: readonly Cota[] = [
    {
      key: 'width',
      from: [-halfWidth, FLOOR_LIFT_M, frontZ],
      to: [halfWidth, FLOOR_LIFT_M, frontZ],
      tick: [0, 0, 1],
      valueM: dimensions.widthM,
    },
    {
      key: 'depth',
      from: [sideX, FLOOR_LIFT_M, -halfDepth],
      to: [sideX, FLOOR_LIFT_M, halfDepth],
      tick: [1, 0, 0],
      valueM: dimensions.depthM,
    },
    {
      key: 'height',
      from: [-sideX, 0, halfDepth],
      to: [-sideX, dimensions.heightM, halfDepth],
      tick: [1, 0, 0],
      valueM: dimensions.heightM,
    },
  ]

  return (
    <group>
      {cotas.map((cota) => (
        <group key={cota.key}>
          <Line points={[[...cota.from], [...cota.to]]} color={COTA_COLOR} lineWidth={COTA_LINE_WIDTH} />
          {[cota.from, cota.to].map((end, index) => (
            <Line
              key={index}
              points={[offsetPoint(end, cota.tick, -TICK_M), offsetPoint(end, cota.tick, TICK_M)]}
              color={COTA_COLOR}
              lineWidth={COTA_LINE_WIDTH}
            />
          ))}
          <Html
            position={midpoint(cota.from, cota.to)}
            center
            zIndexRange={[5, 0]}
            // O contêiner do drei recebe o gesto antes do canvas; sem isto a órbita não começa sobre o número.
            style={{ pointerEvents: 'none' }}
          >
            <span className="cota">{Math.round(metersToCentimeters(cota.valueM))}</span>
          </Html>
        </group>
      ))}
    </group>
  )
}
