import type { DimensionsCm } from '../types/furniture'

/**
 * Veredito de passagem pelo vão (porta/corredor). O móvel atravessa
 * orientado pelo menor lado horizontal — largura ou profundidade.
 * Não considera manobra em L nem inclinação: veredito honesto e simples.
 */
export type DoorFitStatus = 'fits' | 'tight' | 'blocked'

export interface DoorFit {
  readonly status: DoorFitStatus
  /** Sobra (positiva) ou falta (negativa) em cm. */
  readonly gapCm: number
  /** Menor lado horizontal do móvel — o que precisa passar pelo vão. */
  readonly neededCm: number
}

/** Abaixo desta folga a passagem é apertada — mãos, batentes, rodapés. */
const TIGHT_MARGIN_CM = 5

export function computeDoorFit(dimensionsCm: DimensionsCm, doorWidthCm: number): DoorFit {
  const neededCm = Math.min(dimensionsCm.widthCm, dimensionsCm.depthCm)
  const gapCm = doorWidthCm - neededCm

  if (gapCm < 0) return { status: 'blocked', gapCm, neededCm }
  if (gapCm < TIGHT_MARGIN_CM) return { status: 'tight', gapCm, neededCm }
  return { status: 'fits', gapCm, neededCm }
}
