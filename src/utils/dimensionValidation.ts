import { MAX_DIMENSION_CM, MIN_DIMENSION_CM } from '../constants/dimensions'
import type { DimensionsCm } from '../types/furniture'

/**
 * Converte o texto digitado pelo usuário em número de centímetros.
 * Aceita vírgula como separador decimal (padrão pt-BR).
 * Retorna null quando o texto não representa um número válido.
 */
export function parseDimensionInput(rawValue: string): number | null {
  const normalized = rawValue.trim().replace(',', '.')
  if (normalized === '') return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return parsed
}

export function isWithinDimensionLimits(valueCm: number): boolean {
  return valueCm >= MIN_DIMENSION_CM && valueCm <= MAX_DIMENSION_CM
}

export function clampDimensionCm(valueCm: number): number {
  return Math.min(MAX_DIMENSION_CM, Math.max(MIN_DIMENSION_CM, valueCm))
}

/**
 * Medidas lidas (do anúncio) por cima das atuais: o que veio null fica como
 * estava, e tudo cai dentro dos limites da ferramenta.
 */
export function fillMissingMeasures(
  found: Readonly<Record<keyof DimensionsCm, number | null>>,
  base: DimensionsCm,
): DimensionsCm {
  return {
    widthCm: clampDimensionCm(found.widthCm ?? base.widthCm),
    heightCm: clampDimensionCm(found.heightCm ?? base.heightCm),
    depthCm: clampDimensionCm(found.depthCm ?? base.depthCm),
  }
}
