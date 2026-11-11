import { ContactShadows } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import { PerspectiveCamera } from 'three'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import type { CameraPose, GroundPoint, PhotoSize } from '../../utils/roomPhoto'
import { verticalFovDeg } from '../../utils/roomPhoto'
import { FurnitureModel } from '../furniture/FurnitureModel'
import { ScannedModelView } from '../furniture/scanned/ScannedModelView'
import { StudioLights } from '../viewer/StudioLights'

interface RoomSceneProps {
  readonly size: PhotoSize
  readonly pose: CameraPose
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  readonly scannedModel: ScannedModel | null
  readonly position: GroundPoint
  readonly rotationDeg: number
}

const SHADOW_LIFT_M = 0.003

/** Aplica a câmera estimada da foto à câmera padrão da cena. */
function PhotoCamera({ fovDeg, pose }: { readonly fovDeg: number; readonly pose: CameraPose }) {
  useFrame(({ camera }) => {
    if (!(camera instanceof PerspectiveCamera)) return
    camera.fov = fovDeg
    camera.near = 0.05
    camera.far = 100
    camera.position.set(0, pose.heightM, 0)
    camera.rotation.set(-pose.pitchRad, 0, 0)
    camera.updateProjectionMatrix()
  })
  return null
}

/**
 * O móvel desenhado por cima da foto: a câmera 3D imita a câmera estimada da
 * foto, então o móvel sai na perspectiva e no tamanho proporcionais.
 */
export function RoomScene({
  size,
  pose,
  kind,
  dimensions,
  scannedModel,
  position,
  rotationDeg,
}: RoomSceneProps) {
  // Um Object3D só pode estar em uma cena; o original segue no visualizador.
  const ownModel = useMemo(
    () => (scannedModel ? { ...scannedModel, scene: scannedModel.scene.clone(true) } : null),
    [scannedModel],
  )
  const shadowSizeM = Math.max(dimensions.widthM, dimensions.depthM) * 2.2

  return (
    <Canvas
      className="room__canvas"
      shadows
      dpr={[1, 2]}
      // preserveDrawingBuffer: necessário para copiar o móvel na imagem salva.
      gl={{ alpha: true, preserveDrawingBuffer: true }}
    >
      <PhotoCamera fovDeg={verticalFovDeg(size)} pose={pose} />
      <StudioLights />

      <group position={[position.x, 0, position.z]} rotation={[0, (rotationDeg * Math.PI) / 180, 0]}>
        {ownModel ? (
          <ScannedModelView model={ownModel} dimensions={dimensions} />
        ) : (
          <FurnitureModel kind={kind} dimensions={dimensions} />
        )}
      </group>
      <ContactShadows
        position={[position.x, SHADOW_LIFT_M, position.z]}
        opacity={0.6}
        scale={shadowSizeM}
        blur={2.2}
        far={2}
      />
    </Canvas>
  )
}
