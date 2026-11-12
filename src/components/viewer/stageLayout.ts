import type { DimensionsMeters } from '../../types/furniture'
import { metersToCentimeters } from '../../utils/units'
import type { Vec3 } from '../furniture/parts'

/**
 * Geometria do palco: onde fica a pessoa que dá escala, o que os números de
 * fundo dizem e de onde a câmera olha para caber tudo. Só contas, sem three,
 * para o visualizador e a primeira dobra usarem o mesmo enquadramento.
 */

export const FIGURE_HEIGHT_M = 1.7
export const FIGURE_HALF_WIDTH_M = 0.3
/** Vão livre entre a lateral do móvel e a pessoa. */
const FIGURE_CLEARANCE_M = 0.4
/** Recuo da pessoa em relação à linha da frente do móvel. */
const FIGURE_FRONT_INSET_M = 0.12
/** Altura da mira, como fração da altura da cena: abaixo do meio, a cena sobe no quadro. */
const DEFAULT_TARGET_HEIGHT_RATIO = 0.45

/** Pessoa à esquerda do móvel, na linha da frente: atrás, uma geladeira a esconderia. */
export function computeFigurePosition(dimensions: DimensionsMeters): Vec3 {
  const x = -(dimensions.widthM / 2 + FIGURE_CLEARANCE_M + FIGURE_HALF_WIDTH_M)
  const z = Math.max(dimensions.depthM / 2 - FIGURE_FRONT_INSET_M, dimensions.depthM / 4)
  return [x, 0, z]
}

/** "210 × 88 × 95": as medidas gigantes atrás do móvel, em centímetros inteiros. */
export function formatMeasureBackdrop(dimensions: DimensionsMeters): string {
  return [dimensions.widthM, dimensions.heightM, dimensions.depthM]
    .map((valueM) => Math.round(metersToCentimeters(valueM)))
    .join(' × ')
}

interface StageFrameOptions {
  /** Campo de visão vertical da câmera, em graus. */
  readonly fovDegrees: number
  /** Folga em volta da cena: 1 encosta nas bordas. */
  readonly margin: number
  readonly targetHeightRatio?: number
}

interface StageFrame {
  /** Distância da câmera até a mira. */
  readonly distance: number
  /** Para onde a câmera olha: o meio do conjunto móvel + pessoa. */
  readonly target: Vec3
}

/** Enquadra móvel e pessoa inteiros em qualquer medida e formato de tela. */
export function computeStageFrame(
  dimensions: DimensionsMeters,
  aspect: number,
  { fovDegrees, margin, targetHeightRatio = DEFAULT_TARGET_HEIGHT_RATIO }: StageFrameOptions,
): StageFrame {
  const [figureX] = computeFigurePosition(dimensions)
  const leftEdge = figureX - FIGURE_HALF_WIDTH_M
  const rightEdge = dimensions.widthM / 2
  const sceneHeight = Math.max(dimensions.heightM, FIGURE_HEIGHT_M)

  const verticalHalfAngle = (fovDegrees * Math.PI) / 360
  const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspect)
  const halfWidth = (rightEdge - leftEdge) / 2
  // A mira não fica no meio da altura: o lado mais longo (acima ou abaixo dela) é o que precisa caber.
  const halfHeight = sceneHeight * Math.max(targetHeightRatio, 1 - targetHeightRatio)
  const fitDistance = Math.max(
    halfWidth / Math.tan(horizontalHalfAngle),
    halfHeight / Math.tan(verticalHalfAngle),
  )

  return {
    distance: fitDistance * margin + dimensions.depthM / 2,
    target: [(leftEdge + rightEdge) / 2, sceneHeight * targetHeightRatio, 0],
  }
}
