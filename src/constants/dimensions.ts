import type { DimensionFieldConfig } from '../types/furniture'

/** Limites de medida aceitos pela ferramenta, em centímetros. */
// Mínimo de 1 cm: peças finas como quadros têm ~3-5 cm de profundidade.
export const MIN_DIMENSION_CM = 1
export const MAX_DIMENSION_CM = 400

export const DIMENSION_FIELDS: readonly DimensionFieldConfig[] = [
  { axis: 'widthCm', label: 'Largura', hint: 'lado a lado' },
  { axis: 'heightCm', label: 'Altura', hint: 'chão ao topo' },
  { axis: 'depthCm', label: 'Profundidade', hint: 'frente ao fundo' },
]
