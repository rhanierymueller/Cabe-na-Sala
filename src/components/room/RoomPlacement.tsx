import type { PointerEvent } from 'react'
import { useState } from 'react'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import type { CameraPose, GroundPoint, PhotoPoint, PhotoSize } from '../../utils/roomPhoto'
import { groundPointFromPixel, photoPointFromClient } from '../../utils/roomPhoto'
import { RoomScene } from './RoomScene'

interface RoomPlacementProps {
  readonly size: PhotoSize
  readonly pose: CameraPose
  /** Onde o móvel nasce: ao lado da referência, onde a escala é mais confiável. */
  readonly startPoint: PhotoPoint
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  readonly scannedModel: ScannedModel | null
  readonly rotationDeg: number
}

const FALLBACK_POSITION: GroundPoint = { x: 0, z: -3 }

/** O móvel desenhado sobre a foto e a camada de toque que o leva pelo chão. */
export function RoomPlacement({ size, pose, startPoint, ...sceneProps }: RoomPlacementProps) {
  const [position, setPosition] = useState<GroundPoint>(
    () => groundPointFromPixel(startPoint, size, pose) ?? FALLBACK_POSITION,
  )

  const handlePlace = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.buttons === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const pixel = photoPointFromClient(event.clientX, event.clientY, rect, size)
    const ground = pixel && groundPointFromPixel(pixel, size, pose)
    // Toque acima do horizonte não é chão: o móvel fica onde estava.
    if (ground) setPosition(ground)
  }

  return (
    <>
      <RoomScene size={size} pose={pose} position={position} {...sceneProps} />
      <div className="room__touch" onPointerDown={handlePlace} onPointerMove={handlePlace} />
    </>
  )
}
