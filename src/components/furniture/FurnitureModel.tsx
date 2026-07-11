import { useAnimatedDimensions } from '../../hooks/useAnimatedDimensions'
import type { DimensionsMeters, FurnitureKind } from '../../types/furniture'
import { FURNITURE_CATALOG } from './catalog'
import type { FurniturePart } from './parts'

interface FurnitureModelProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
}

const CYLINDER_SEGMENTS = 32

export function PartMesh({ part }: { readonly part: FurniturePart }) {
  return (
    <mesh
      position={part.position}
      rotation={part.rotation}
      scale={part.size}
      castShadow
      receiveShadow
    >
      {part.shape === 'box' ? (
        <boxGeometry />
      ) : (
        <cylinderGeometry args={[1, 1, 1, CYLINDER_SEGMENTS]} />
      )}
      <meshStandardMaterial
        color={part.material.color}
        roughness={part.material.roughness}
        metalness={part.material.metalness}
      />
    </mesh>
  )
}

/**
 * Renderer único do catálogo: qualquer móvel é uma lista de peças
 * paramétricas, então mudar as medidas regenera o modelo sem deformar
 * detalhes — e trocar de móvel é só trocar a função de layout.
 */
export function FurnitureModel({ kind, dimensions }: FurnitureModelProps) {
  const animatedDimensions = useAnimatedDimensions(dimensions)
  const layout = FURNITURE_CATALOG[kind].computeLayout(animatedDimensions)

  return (
    <group>
      {layout.map((part, index) => (
        <PartMesh key={`${kind}-${index}`} part={part} />
      ))}
    </group>
  )
}
