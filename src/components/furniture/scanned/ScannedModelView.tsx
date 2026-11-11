import { useMemo } from 'react'
import { useAnimatedDimensions } from '../../../hooks/useAnimatedDimensions'
import type { DimensionsMeters, ScannedModel } from '../../../types/furniture'
import { computeFitScale, normalizeModel } from './fitModel'

const SCANNED_FILL_LIGHT = 0.9

interface ScannedModelViewProps {
  readonly model: ScannedModel
  readonly dimensions: DimensionsMeters
}

/**
 * Modelo vindo de foto ou arquivo, esticado até a caixa exata das medidas
 * digitadas — a forma vem da foto, o tamanho vem de quem mediu.
 */
export function ScannedModelView({ model, dimensions }: ScannedModelViewProps) {
  const animatedDimensions = useAnimatedDimensions(dimensions)
  const normalized = useMemo(
    () => normalizeModel(model.scene, model.quarterTurns),
    [model.scene, model.quarterTurns],
  )
  const [scaleX, scaleY, scaleZ] = computeFitScale(normalized.baseSize, animatedDimensions)

  return (
    <>
      {/* Luz de preenchimento só para modelo de foto ou arquivo: a textura deles já traz sombra pintada. */}
      <ambientLight intensity={SCANNED_FILL_LIGHT} />
      <group scale={[scaleX, scaleY, scaleZ]}>
        <primitive object={normalized.root} />
      </group>
    </>
  )
}
