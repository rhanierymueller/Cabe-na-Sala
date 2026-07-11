import { Html } from '@react-three/drei'
import type { LucideIcon } from 'lucide-react'
import { MoveDiagonal, MoveHorizontal, MoveVertical } from 'lucide-react'
import type { DimensionsMeters } from '../../types/furniture'
import { metersToCentimeters } from '../../utils/units'

interface DimensionLabelsProps {
  readonly dimensions: DimensionsMeters
  readonly isVisible: boolean
}

const LABEL_MARGIN_M = 0.14
const LABEL_ICON_SIZE = 13

/**
 * Medidas flutuando ao redor do móvel na cena 3D — antecipa o que o
 * usuário verá em AR (medidas sobre o objeto compensam a falta de colisão).
 */
export function DimensionLabels({ dimensions, isVisible }: DimensionLabelsProps) {
  const { widthM, heightM, depthM } = dimensions
  const visibilityClass = isVisible ? ' dimension-tag--visible' : ''

  const labels: readonly {
    readonly key: string
    readonly icon: LucideIcon
    readonly valueCm: number
    readonly position: readonly [number, number, number]
  }[] = [
    {
      key: 'width',
      icon: MoveHorizontal,
      valueCm: metersToCentimeters(widthM),
      position: [0, heightM + LABEL_MARGIN_M, depthM / 2],
    },
    {
      key: 'height',
      icon: MoveVertical,
      valueCm: metersToCentimeters(heightM),
      position: [widthM / 2 + LABEL_MARGIN_M, heightM / 2, depthM / 2],
    },
    {
      key: 'depth',
      icon: MoveDiagonal,
      valueCm: metersToCentimeters(depthM),
      position: [widthM / 2 + LABEL_MARGIN_M, LABEL_MARGIN_M, 0],
    },
  ]

  return (
    <>
      {labels.map((label) => (
        <Html key={label.key} position={[...label.position]} center zIndexRange={[5, 0]}>
          <span className={`dimension-tag${visibilityClass}`}>
            <label.icon size={LABEL_ICON_SIZE} aria-hidden="true" />
            {Math.round(label.valueCm)} cm
          </span>
        </Html>
      ))}
    </>
  )
}
