import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, box } from '../parts'

/** Quadro com moldura — tamanho comum de sala (60 × 80 cm). */
export const DEFAULT_FRAME_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 60,
  heightCm: 80,
  depthCm: 4,
}

const BORDER_RATIO = 0.07
const CANVAS_DEPTH_RATIO = 0.5
const CANVAS_RECESS_RATIO = 0.2
const ART_WIDTH_RATIO = 0.55
const ART_HEIGHT_RATIO = 0.45

/**
 * Quadro em pé (apoiado no chão, como na loja ou encostado na parede):
 * quatro réguas de moldura, tela recuada e um bloco de "arte" ao centro.
 * A profundidade fina faz o veredito da porta ser quase sempre "passa".
 */
export function computeFrameLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions

  const border = Math.min(widthM, heightM) * BORDER_RATIO
  const innerWidth = widthM - border * 2
  const innerHeight = heightM - border * 2
  const canvasZ = -depthM * CANVAS_RECESS_RATIO
  const canvasDepth = depthM * CANVAS_DEPTH_RATIO

  return [
    // Moldura: base, topo e laterais
    box([0, border / 2, 0], [widthM, border, depthM], MATERIALS.woodDark),
    box([0, heightM - border / 2, 0], [widthM, border, depthM], MATERIALS.woodDark),
    box(
      [-(widthM - border) / 2, heightM / 2, 0],
      [border, innerHeight, depthM],
      MATERIALS.woodDark,
    ),
    box([(widthM - border) / 2, heightM / 2, 0], [border, innerHeight, depthM], MATERIALS.woodDark),
    // Tela recuada
    box([0, heightM / 2, canvasZ], [innerWidth, innerHeight, canvasDepth], MATERIALS.canvas),
    // Bloco de "arte" abstrata ao centro
    box(
      [0, heightM / 2, canvasZ + canvasDepth / 2],
      [innerWidth * ART_WIDTH_RATIO, innerHeight * ART_HEIGHT_RATIO, canvasDepth * 0.2],
      MATERIALS.fabricSeat,
    ),
  ]
}
