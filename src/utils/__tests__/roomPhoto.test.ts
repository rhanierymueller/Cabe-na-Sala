import { describe, expect, test } from 'vitest'
import type { CameraPose, PhotoPoint, PhotoSize } from '../roomPhoto'
import {
  ASSUMED_CAMERA_HEIGHT_M,
  estimateCameraPose,
  focalLengthPx,
  groundPointFromPixel,
  photoPointFromClient,
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
  test.each([0, 8, 20, 35])('recovers a %i degree tilt from a 2.10 m door', (pitchDeg) => {
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

  test('finds another camera height when the default one does not fit (counter seen from above)', () => {
    // Arrange: bancada de 90 cm marcada numa foto tirada de cima, bem inclinada.
    const reference = { bottom: { x: 2280, y: 3540 }, top: { x: 2280, y: 1920 }, heightM: 0.9 }

    // Act
    const pose = estimateCameraPose(reference, SIZE)

    // Assert
    expect(pose).not.toBeNull()
    expect(pose?.heightM).toBeLessThan(ASSUMED_CAMERA_HEIGHT_M)
  })

  test('returns null when the top is below the bottom', () => {
    const reference = { bottom: { x: 1500, y: 1000 }, top: { x: 1500, y: 3000 }, heightM: 2.1 }

    expect(estimateCameraPose(reference, SIZE)).toBeNull()
  })

  test('returns null for a zero height', () => {
    const reference = { bottom: { x: 1500, y: 3000 }, top: { x: 1500, y: 1000 }, heightM: 0 }

    expect(estimateCameraPose(reference, SIZE)).toBeNull()
  })
})

describe('groundPointFromPixel', () => {
  test('returns the floor point that was projected onto the photo', () => {
    const pose = poseWith(15)
    const pixel = project([-0.8, 0, -2.5], pose)

    const ground = groundPointFromPixel(pixel, SIZE, pose)

    expect(ground?.x).toBeCloseTo(-0.8, 4)
    expect(ground?.z).toBeCloseTo(-2.5, 4)
  })

  test('returns null for a touch above the horizon', () => {
    expect(groundPointFromPixel({ x: 1500, y: 100 }, SIZE, poseWith(0))).toBeNull()
  })
})

describe('verticalFovDeg', () => {
  test('a portrait photo from the main camera spans about 69 degrees vertically', () => {
    expect(verticalFovDeg(SIZE)).toBeCloseTo(69.4, 0)
  })
})

describe('photoPointFromClient', () => {
  const RECT = { left: 100, top: 50, width: 300, height: 400 }

  test('maps a touch on the screen to the same spot on the original photo', () => {
    // Act
    const point = photoPointFromClient(250, 250, RECT, SIZE)

    // Assert
    expect(point).toEqual({ x: 1500, y: 2000 })
  })

  test('keeps a drag that leaves the photo pinned to its edge', () => {
    // Act
    const point = photoPointFromClient(20, 900, RECT, SIZE)

    // Assert
    expect(point).toEqual({ x: 0, y: SIZE.heightPx })
  })

  test('returns null while the photo has no size on screen', () => {
    expect(photoPointFromClient(10, 10, { ...RECT, width: 0 }, SIZE)).toBeNull()
  })
})
