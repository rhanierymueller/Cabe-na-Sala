import { ContactShadows, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { FurnitureModel } from '../furniture/FurnitureModel'
import { ScannedModelView } from '../furniture/scanned/ScannedModelView'
import { DimensionCotas } from './DimensionCotas'
import { StudioLights } from './StudioLights'

interface FurnitureViewerProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  /** Modelo do produto real (foto ou arquivo); sem ele, vale o móvel do catálogo. */
  readonly scannedModel?: ScannedModel | null
}

const CAMERA_FOV = 45
const GRID_CELL_COLOR = '#3a362f'
const GRID_SECTION_COLOR = '#5a5449'
const MIN_CAMERA_DISTANCE = 1.8

interface CameraPose {
  readonly position: [number, number, number]
  readonly target: [number, number, number]
}

/** Enquadra o móvel: quanto maior a peça, mais longe a câmera nasce. */
function computeCameraPose(dimensions: DimensionsMeters): CameraPose {
  const largestDimension = Math.max(dimensions.widthM, dimensions.heightM, dimensions.depthM)
  const distance = Math.max(MIN_CAMERA_DISTANCE, largestDimension * 2.2)

  return {
    position: [distance * 0.72, Math.max(1.1, dimensions.heightM * 1.15), distance],
    target: [0, dimensions.heightM * 0.45, 0],
  }
}

/**
 * Cena 3D do móvel: chão com grade (1 célula = 10 cm, seção = 1 m),
 * luz de estúdio, cotas técnicas e câmera orbital. O Canvas remonta a cada troca de
 * móvel (key) para reenquadrar a câmera no tamanho da nova peça.
 */
export function FurnitureViewer({ kind, dimensions, scannedModel }: FurnitureViewerProps) {
  const cameraPose = computeCameraPose(dimensions)

  return (
    <Canvas
      key={kind}
      shadows
      camera={{ position: cameraPose.position, fov: CAMERA_FOV }}
      dpr={[1, 2]}
      // Fundo transparente: o foco de luz vem do CSS de .tool__canvas.
      gl={{ alpha: true }}
    >
      <StudioLights />

      {scannedModel ? (
        <ScannedModelView model={scannedModel} dimensions={dimensions} />
      ) : (
        <FurnitureModel kind={kind} dimensions={dimensions} />
      )}
      <DimensionCotas dimensions={dimensions} />

      <Grid
        infiniteGrid
        cellSize={0.1}
        sectionSize={1}
        cellColor={GRID_CELL_COLOR}
        sectionColor={GRID_SECTION_COLOR}
        fadeDistance={14}
        fadeStrength={2}
      />
      <ContactShadows opacity={0.55} scale={10} blur={2.4} far={2.5} />

      <OrbitControls
        makeDefault
        enableDamping
        target={cameraPose.target}
        minDistance={0.8}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  )
}
