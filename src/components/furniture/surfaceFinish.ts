import type { MaterialSpec } from './parts'

/** Acima desta aspereza o material do catálogo é tecido (sofá, colchão, almofada). */
const FABRIC_ROUGHNESS = 0.85
/** Abaixo desta, é superfície polida (vidro, cooktop, espelho). */
const GLOSS_ROUGHNESS = 0.25
const FABRIC_SHEEN = 1
const GLOSS_CLEARCOAT = 0.8

interface SurfaceFinish {
  /** Brilho rasante de veludo, 0 a 1. */
  readonly sheen: number
  /** Camada de verniz por cima, 0 a 1. */
  readonly clearcoat: number
  /** Se a superfície leva a trama de tecido em relevo. */
  readonly hasWeave: boolean
}

/**
 * Acabamento de foto de produto para um material do catálogo. Só muda como a
 * luz bate na tela: cor, aspereza e metal continuam os do catálogo, que é o
 * que vai para o AR.
 */
export function describeSurfaceFinish(material: MaterialSpec): SurfaceFinish {
  const isFabric = material.roughness >= FABRIC_ROUGHNESS
  const isGloss = material.roughness <= GLOSS_ROUGHNESS

  return {
    sheen: isFabric ? FABRIC_SHEEN : 0,
    clearcoat: isGloss ? GLOSS_CLEARCOAT : 0,
    hasWeave: isFabric,
  }
}
