import { ContactShadows, Grid } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { MotionValue } from 'framer-motion'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { dimensionsCmToMeters } from '../../utils/units'
import { DEFAULT_STOVE_DIMENSIONS_CM } from '../furniture/catalog'
import { FurnitureModel } from '../furniture/FurnitureModel'
import { DimensionLabels } from './DimensionLabels'
import { KitchenSet } from './KitchenSet'
import { computePortraitCompensation, sampleStoryFrame } from './storyTimeline'

interface StorySceneProps {
  readonly progress: MotionValue<number>
}

const STORY_DIMENSIONS = dimensionsCmToMeters(DEFAULT_STOVE_DIMENSIONS_CM)
const KITCHEN_HIDDEN_SCALE = 0.001

/**
 * Conteúdo do Canvas do scrollytelling: aplica a cada frame o estado
 * calculado por sampleStoryFrame (posição do móvel, cozinha, câmera).
 */
export function StoryScene({ progress }: StorySceneProps) {
  const stoveGroupRef = useRef<Group>(null)
  const kitchenGroupRef = useRef<Group>(null)
  const labelsGroupRef = useRef<Group>(null)
  const [areLabelsVisible, setLabelsVisible] = useState(false)
  const labelsVisibleRef = useRef(false)

  useFrame(({ camera, size }) => {
    const frame = sampleStoryFrame(progress.get())
    const { distanceFactor, lookAtYOffset } = computePortraitCompensation(
      size.width / size.height,
    )

    if (stoveGroupRef.current) {
      stoveGroupRef.current.position.set(...frame.stovePosition)
      stoveGroupRef.current.rotation.y = frame.stoveRotationY
    }

    if (kitchenGroupRef.current) {
      kitchenGroupRef.current.visible = frame.kitchenGrowth > 0.002
      // A cozinha "cresce" do chão conforme o scroll avança.
      kitchenGroupRef.current.scale.set(
        1,
        Math.max(KITCHEN_HIDDEN_SCALE, frame.kitchenGrowth),
        1,
      )
    }

    // As medidas acompanham o móvel (que desliza até o vão).
    labelsGroupRef.current?.position.set(...frame.stovePosition)

    const [cameraX, cameraY, cameraZ] = frame.cameraPosition
    camera.position.set(
      cameraX * distanceFactor,
      cameraY * distanceFactor,
      cameraZ * distanceFactor,
    )
    const [lookX, lookY, lookZ] = frame.lookAtTarget
    camera.lookAt(lookX, lookY + lookAtYOffset, lookZ)

    if (frame.areLabelsVisible !== labelsVisibleRef.current) {
      labelsVisibleRef.current = frame.areLabelsVisible
      setLabelsVisible(frame.areLabelsVisible)
    }
  })

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} />

      <group ref={stoveGroupRef}>
        <FurnitureModel kind="stove" dimensions={STORY_DIMENSIONS} />
      </group>

      <group ref={kitchenGroupRef} visible={false}>
        <KitchenSet />
      </group>

      <group ref={labelsGroupRef}>
        <DimensionLabels dimensions={STORY_DIMENSIONS} isVisible={areLabelsVisible} />
      </group>

      <Grid
        infiniteGrid
        cellSize={0.1}
        sectionSize={1}
        cellColor="#1a1f26"
        sectionColor="#262d37"
        fadeDistance={10}
        fadeStrength={2.5}
      />
      <ContactShadows opacity={0.4} scale={7} blur={2.4} far={2.4} />
    </>
  )
}
