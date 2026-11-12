import { useEffect, useMemo } from 'react'
import { useAnimatedDimensions } from '../../hooks/useAnimatedDimensions'
import type { DimensionsMeters, FurnitureKind } from '../../types/furniture'
import { FURNITURE_CATALOG } from './catalog'
import { createPartGeometry } from './partGeometry'
import type { FurniturePart } from './parts'
import { describeSurfaceFinish } from './surfaceFinish'
import { getWeaveTexture } from './weaveTexture'

interface FurnitureModelProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
}

const SHEEN_COLOR = '#fff1dd'
const WEAVE_BUMP_SCALE = 0.6

function PartMesh({ part }: { readonly part: FurniturePart }) {
  const [sizeX, sizeY, sizeZ] = part.size
  const geometry = useMemo(
    () => createPartGeometry(part),
    // A geometria só depende da forma e do tamanho — não da posição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [part.shape, sizeX, sizeY, sizeZ, part.radius],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  const finish = describeSurfaceFinish(part.material)

  return (
    <mesh
      position={part.position}
      rotation={part.rotation}
      geometry={geometry}
      castShadow
      receiveShadow
    >
      <meshPhysicalMaterial
        color={part.material.color}
        roughness={part.material.roughness}
        metalness={part.material.metalness}
        sheen={finish.sheen}
        sheenRoughness={0.55}
        sheenColor={SHEEN_COLOR}
        bumpMap={finish.hasWeave ? getWeaveTexture() : null}
        bumpScale={finish.hasWeave ? WEAVE_BUMP_SCALE : 0}
        clearcoat={finish.clearcoat}
        clearcoatRoughness={0.15}
        envMapIntensity={1.25}
      />
    </mesh>
  )
}

/** As peças do móvel exatamente nas medidas recebidas, sem animar. */
export function FurnitureParts({ kind, dimensions }: FurnitureModelProps) {
  const layout = FURNITURE_CATALOG[kind].computeLayout(dimensions)

  return (
    <group>
      {layout.map((part, index) => (
        <PartMesh key={`${kind}-${index}`} part={part} />
      ))}
    </group>
  )
}

/**
 * Renderer único do catálogo: qualquer móvel é uma lista de peças
 * paramétricas, então mudar as medidas regenera o modelo sem deformar
 * detalhes — e trocar de móvel é só trocar a função de layout.
 */
export function FurnitureModel({ kind, dimensions }: FurnitureModelProps) {
  const animatedDimensions = useAnimatedDimensions(dimensions)
  return <FurnitureParts kind={kind} dimensions={animatedDimensions} />
}
