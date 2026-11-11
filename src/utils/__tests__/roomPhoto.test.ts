import { describe, expect, test } from 'vitest'
import type { CameraPose, PhotoPoint, PhotoSize } from '../roomPhoto'
import {
  ASSUMED_CAMERA_HEIGHT_M,
  estimateCameraPose,
  focalLengthPx,
  groundPointFromPixel,
  verticalFovDeg,
} from '../roomPhoto'

const SIZE: PhotoSize = { widthPx: 3000, heightPx: 4000 }

/** Projeta um ponto do mundo na foto — o inverso do que o código estima. */
function project(world: readonly [number, number, number], pose: CameraPose): PhotoPoint {
  const [x, y, z] = world
  const relY = y - pose.heightM
  const cos = Math.cos(pose.pitchRad)
  const sin = Math.sin(pose.pitchRad)
  const camY = relY * cos - z * sin
  const camZ = relY * sin + z * cos
  const scale = pose.focalPx / -camZ
  return { x: SIZE.widthPx / 2 + x * scale, y: SIZE.heightPx / 2 - camY * scale }
}

function poseWith(pitchDeg: number): CameraPose {
  return {
    focalPx: focalLengthPx(SIZE),
    pitchRad: (pitchDeg * Math.PI) / 180,
    heightM: ASSUMED_CAMERA_HEIGHT_M,
  }
}

describe('estimateCameraPose', () => {
  test.each([0, 8, 20, 35])('recupera a inclinação de %i graus por uma porta de 2,10 m', (pitchDeg) => {
    // Arrange
    const truth = poseWith(pitchDeg)
    const reference = {
      bottom: project([0.6, 0, -3], truth),
      top: project([0.6, 2.1, -3], truth),
      heightM: 2.1,
    }

    // Act
    const pose = estimateCameraPose(reference, SIZE)

    // Assert
    expect(pose).not.toBeNull()
    expect(pose?.pitchRad).toBeCloseTo(truth.pitchRad, 3)
  })

  test('devolve null quando o topo está abaixo da base', () => {
    const reference = { bottom: { x: 1500, y: 1000 }, top: { x: 1500, y: 3000 }, heightM: 2.1 }

    expect(estimateCameraPose(reference, SIZE)).toBeNull()
  })

  test('devolve null para altura zero', () => {
    const reference = { bottom: { x: 1500, y: 3000 }, top: { x: 1500, y: 1000 }, heightM: 0 }

    expect(estimateCameraPose(reference, SIZE)).toBeNull()
  })
})

describe('groundPointFromPixel', () => {
  test('devolve o ponto do chão que foi projetado na foto', () => {
    const pose = poseWith(15)
    const pixel = project([-0.8, 0, -2.5], pose)

    const ground = groundPointFromPixel(pixel, SIZE, pose)

    expect(ground?.x).toBeCloseTo(-0.8, 4)
    expect(ground?.z).toBeCloseTo(-2.5, 4)
  })

  test('devolve null para um toque acima do horizonte', () => {
    expect(groundPointFromPixel({ x: 1500, y: 100 }, SIZE, poseWith(0))).toBeNull()
  })
})

describe('verticalFovDeg', () => {
  test('foto em pé da câmera principal tem cerca de 69 graus na vertical', () => {
    expect(verticalFovDeg(SIZE)).toBeCloseTo(69.4, 0)
  })
})
