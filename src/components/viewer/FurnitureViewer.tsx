import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useAnimatedDimensions } from '../../hooks/useAnimatedDimensions'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { FurnitureModel } from '../furniture/FurnitureModel'
import { ScannedModelView } from '../furniture/scanned/ScannedModelView'
import { DimensionLines } from './DimensionLines'
import { MeasureBackdrop } from './MeasureBackdrop'
import { ScaleFigure } from './ScaleFigure'
import { computeFigurePosition, computeStageFrame } from './stageLayout'
import { StudioLights } from './StudioLights'
import { StudioStage } from './StudioStage'

interface FurnitureViewerProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  /** Modelo do produto real (foto ou arquivo); sem ele, vale o móvel do catálogo. */
  readonly scannedModel?: ScannedModel | null
}

const CAMERA_FOV = 32
const FRAME_MARGIN = 1.5
/** Mira um pouco abaixo do meio: a cena sobe e livra o cartão do QR no canto de baixo. */
const TARGET_HEIGHT_RATIO = 0.36
/** De onde a câmera nasce: um pouco de lado e de cima, como foto de catálogo. */
const START_AZIMUTH = 0.4
const START_POLAR = 1.32
/** No celular a barra de móveis fica por cima do 3D; no computador ela é estreita e não atrapalha. */
const TOP_BAR_SELECTOR = '.furniture-dock'
const COVERED_TOP_QUERY = '(max-width: 900px)'

/** Fração do alto do canvas escondida atrás da barra de móveis. */
function measureTopInsetRatio(canvas: HTMLCanvasElement): number {
  if (!window.matchMedia(COVERED_TOP_QUERY).matches) return 0
  const bar = document.querySelector(TOP_BAR_SELECTOR)
  const frame = canvas.getBoundingClientRect()
  if (!bar || frame.height === 0) return 0
  return Math.max(0, bar.getBoundingClientRect().bottom - frame.top) / frame.height
}

/**
 * Enquadra móvel e pessoa uma vez, quando a cena monta (o Canvas remonta a
 * cada troca de móvel). Depois disso a câmera é de quem está olhando: gira
 * 360°, aproxima e afasta.
 */
function StageCamera({ dimensions }: { readonly dimensions: DimensionsMeters }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const canvas = useThree((state) => state.gl.domElement)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useLayoutEffect(() => {
    const { distance, target } = computeStageFrame(dimensions, size.width / size.height, {
      fovDegrees: CAMERA_FOV,
      margin: FRAME_MARGIN,
      targetHeightRatio: TARGET_HEIGHT_RATIO,
      topInsetRatio: measureTopInsetRatio(canvas),
    })
    camera.position.set(
      target[0] + distance * Math.sin(START_POLAR) * Math.sin(START_AZIMUTH),
      target[1] + distance * Math.cos(START_POLAR),
      target[2] + distance * Math.sin(START_POLAR) * Math.cos(START_AZIMUTH),
    )
    controlsRef.current?.target.set(...target)
    controlsRef.current?.update()
    // Só na montagem: reenquadrar a cada medida tiraria a câmera da mão da pessoa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      minDistance={0.8}
      maxDistance={12}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  )
}

function Scene({ kind, dimensions, scannedModel }: FurnitureViewerProps) {
  // A pessoa e os números de fundo andam junto com o móvel enquanto ele estica.
  const animated = useAnimatedDimensions(dimensions)

  return (
    <>
      <StudioLights />
      <StudioStage />

      {scannedModel ? (
        <ScannedModelView model={scannedModel} dimensions={dimensions} />
      ) : (
        <FurnitureModel kind={kind} dimensions={dimensions} />
      )}
      <DimensionLines dimensions={dimensions} />
      <ScaleFigure position={computeFigurePosition(animated)} />
      <MeasureBackdrop dimensions={animated} />

      <StageCamera dimensions={dimensions} />
    </>
  )
}

/**
 * Cena 3D do móvel: estúdio com chão que reflete, uma pessoa de 1,70 m para
 * dar escala, cotas técnicas e câmera orbital livre. O Canvas remonta a cada
 * troca de móvel (key) para reenquadrar a câmera no tamanho da nova peça.
 */
export function FurnitureViewer({ kind, dimensions, scannedModel }: FurnitureViewerProps) {
  return (
    <Canvas
      key={kind}
      // PCF: o three não tem mais o PCFSoftShadowMap (só avisava e usava este).
      shadows="percentage"
      camera={{ fov: CAMERA_FOV }}
      dpr={[1, 2]}
    >
      <Scene kind={kind} dimensions={dimensions} scannedModel={scannedModel} />
    </Canvas>
  )
}
