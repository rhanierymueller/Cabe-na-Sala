import type { BufferGeometry } from 'three'
import { BoxGeometry, CylinderGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { FurniturePart } from './parts'

const CYLINDER_SEGMENTS = 32
const ROUNDED_SEGMENTS = 4

/**
 * Geometria em tamanho real (metros) de uma peça. Fonte única para o viewer
 * e para o exportador USDZ — o que aparece na tela é o que vai para o AR.
 */
export function createPartGeometry(part: FurniturePart): BufferGeometry {
  const [sizeX, sizeY, sizeZ] = part.size

  if (part.shape === 'cylinder') {
    return new CylinderGeometry(sizeX, sizeX, sizeY, CYLINDER_SEGMENTS)
  }
  if (part.shape === 'roundedBox') {
    return new RoundedBoxGeometry(sizeX, sizeY, sizeZ, ROUNDED_SEGMENTS, part.radius ?? 0)
  }
  return new BoxGeometry(sizeX, sizeY, sizeZ)
}
