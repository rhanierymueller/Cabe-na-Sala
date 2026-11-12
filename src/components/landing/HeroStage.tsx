import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { MathUtils } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { FurnitureParts } from '../furniture/FurnitureModel'
import { DimensionLines } from '../viewer/DimensionLines'
import { MeasureBackdrop } from '../viewer/MeasureBackdrop'
import { ScaleFigure } from '../viewer/ScaleFigure'
import { computeFigurePosition, computeStageFrame } from '../viewer/stageLayout'
import { StudioLights } from '../viewer/StudioLights'
import { StudioStage } from '../viewer/StudioStage'
import { useAnimatedDimensions } from '../../hooks/useAnimatedDimensions'
import type { DimensionsMeters, FurnitureKind } from '../../types/furniture'

interface HeroStageProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
}

const CAMERA_FOV = 30
/** De onde a câmera olha: um pouco de lado e de cima, como foto de catálogo. */
const BASE_AZIMUTH = 0.5
const BASE_POLAR = 1.36
/** Antes do primeiro toque o móvel balança devagar, para mostrar que é 3D. */
const IDLE_SWAY_RADIANS = 0.28
const IDLE_SWAY_SPEED = 0.35
/** Folga em volta da cena; no computador sobra mais, para a barra de medidas não cobrir o móvel. */
const FRAME_MARGIN = 1.3
const FRAME_MARGIN_PORTRAIT = 1.12
/** Mira abaixo do meio da cena: o conjunto sobe no quadro e livra a barra de medidas. */
const TARGET_HEIGHT_RATIO = 0.3
/** O móvel nasce pequeno e cresce até a medida: é a entrada da página. */
const ENTRANCE_SCALE = 0.55
const CAMERA_DAMPING = 5

function shrink(dimensions: DimensionsMeters): DimensionsMeters {
  return {
    widthM: dimensions.widthM * ENTRANCE_SCALE,
    heightM: dimensions.heightM * ENTRANCE_SCALE,
    depthM: dimensions.depthM * ENTRANCE_SCALE,
  }
}

/** Reenquadra a cada medida (aqui não há zoom) e deixa girar 360° no arrasto. */
function CameraRig({ dimensions }: { readonly dimensions: DimensionsMeters }) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const hasInteractedRef = useRef(false)

  useFrame(({ size, clock }, deltaSeconds) => {
    const controls = controlsRef.current
    if (!controls) return

    const aspect = size.width / size.height
    const frame = computeStageFrame(dimensions, aspect, {
      fovDegrees: CAMERA_FOV,
      margin: aspect < 1 ? FRAME_MARGIN_PORTRAIT : FRAME_MARGIN,
      targetHeightRatio: TARGET_HEIGHT_RATIO,
    })

    const distance = MathUtils.damp(controls.getDistance(), frame.distance, CAMERA_DAMPING, deltaSeconds)
    // Mínimo = máximo: é assim que o OrbitControls aceita uma distância imposta.
    controls.minDistance = distance
    controls.maxDistance = distance
    controls.target.x = MathUtils.damp(controls.target.x, frame.target[0], CAMERA_DAMPING, deltaSeconds)
    controls.target.y = MathUtils.damp(controls.target.y, frame.target[1], CAMERA_DAMPING, deltaSeconds)

    if (!hasInteractedRef.current) {
      controls.setAzimuthalAngle(
        BASE_AZIMUTH + Math.sin(clock.elapsedTime * IDLE_SWAY_SPEED) * IDLE_SWAY_RADIANS,
      )
    }
    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false}
      enablePan={false}
      enableDamping
      minPolarAngle={1.0}
      maxPolarAngle={1.5}
      onStart={() => {
        hasInteractedRef.current = true
      }}
    />
  )
}

function Scene({ kind, dimensions }: HeroStageProps) {
  const [hasEntered, setHasEntered] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const animated = useAnimatedDimensions(hasEntered ? dimensions : shrink(dimensions))

  return (
    <>
      <StudioLights />
      <StudioStage />

      <FurnitureParts kind={kind} dimensions={animated} />
      <DimensionLines dimensions={animated} />
      <ScaleFigure position={computeFigurePosition(animated)} />
      <MeasureBackdrop dimensions={animated} />

      <CameraRig dimensions={animated} />
    </>
  )
}

/** Palco da landing: o mesmo estúdio da ferramenta, com a câmera que se enquadra sozinha. */
export function HeroStage({ kind, dimensions }: HeroStageProps) {
  const startDistance = 6
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{
        fov: CAMERA_FOV,
        position: [
          startDistance * Math.sin(BASE_POLAR) * Math.sin(BASE_AZIMUTH),
          startDistance * Math.cos(BASE_POLAR) + 0.6,
          startDistance * Math.sin(BASE_POLAR) * Math.cos(BASE_AZIMUTH),
        ],
      }}
    >
      <Scene kind={kind} dimensions={dimensions} />
    </Canvas>
  )
}
