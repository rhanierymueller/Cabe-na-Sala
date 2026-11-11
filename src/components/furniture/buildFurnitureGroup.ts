import { Group, Mesh, MeshStandardMaterial } from 'three'
import type { DimensionsMeters, FurnitureKind } from '../../types/furniture'
import { FURNITURE_CATALOG } from './catalog'
import { createPartGeometry } from './partGeometry'
import type { FurniturePart } from './parts'

function createPartMesh(part: FurniturePart): Mesh {
  const material = new MeshStandardMaterial({
    color: part.material.color,
    roughness: part.material.roughness,
    metalness: part.material.metalness,
  })

  const mesh = new Mesh(createPartGeometry(part), material)
  mesh.position.set(...part.position)
  mesh.rotation.set(...part.rotation)
  return mesh
}

/**
 * Monta qualquer móvel do catálogo como THREE.Group puro (fora do React) —
 * usado pelo exportador USDZ para AR. Origem no centro da base (chão em y = 0).
 */
export function buildFurnitureGroup(kind: FurnitureKind, dimensions: DimensionsMeters): Group {
  const layout = FURNITURE_CATALOG[kind].computeLayout(dimensions)
  const group = new Group()

  layout.forEach((part) => group.add(createPartMesh(part)))

  group.updateMatrixWorld(true)
  return group
}
