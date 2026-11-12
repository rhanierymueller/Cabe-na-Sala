import type { DimensionsCm, DimensionsMeters } from '../../../types/furniture'
import type { FurnitureLayout } from '../parts'
import { MATERIALS, roundedBox } from '../parts'

/** Ponto de partida neutro: um cubo de 60 cm, do tamanho de um eletrodoméstico pequeno. */
export const DEFAULT_OTHER_DIMENSIONS_CM: DimensionsCm = {
  widthCm: 60,
  heightCm: 60,
  depthCm: 60,
}

/** Quinas só quebradas: o bloco tem de parecer do tamanho exato que foi digitado. */
const EDGE_RATIO = 0.03

/**
 * Qualquer coisa que não está no catálogo (micro-ondas, aquário, freezer):
 * um bloco com exatamente as medidas digitadas. Sem desenho, só o volume.
 */
export function computeOtherLayout(dimensions: DimensionsMeters): FurnitureLayout {
  const { widthM, heightM, depthM } = dimensions
  return [roundedBox([0, heightM / 2, 0], [widthM, heightM, depthM], MATERIALS.lacquer, EDGE_RATIO)]
}
