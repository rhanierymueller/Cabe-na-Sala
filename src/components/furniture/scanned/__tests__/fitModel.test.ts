import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import { describe, expect, test } from 'vitest'
import type { DimensionsMeters } from '../../../../types/furniture'
import { buildScannedGroup, hasRenderableGeometry, suggestQuarterTurns } from '../fitModel'

const TARGET: DimensionsMeters = { widthM: 2.1, heightM: 0.88, depthM: 0.95 }

/** Modelo "cru", como sai de um gerador: fora da origem, flutuando, sem escala real. */
function createRawModel(sizeX: number, sizeY: number, sizeZ: number): Group {
  const mesh = new Mesh(new BoxGeometry(sizeX, sizeY, sizeZ), new MeshStandardMaterial())
  mesh.position.set(3, 7, -2)
  const group = new Group()
  group.add(mesh)
  return group
}

function measure(group: Group): { size: Vector3; box: Box3 } {
  const box = new Box3().setFromObject(group)
  return { size: box.getSize(new Vector3()), box }
}

describe('buildScannedGroup', () => {
  test('fits any model exactly into the typed dimensions (real scale is sacred)', () => {
    const fitted = buildScannedGroup(createRawModel(0.4, 0.3, 0.2), TARGET, 0)

    const { size } = measure(fitted)

    expect(size.x).toBeCloseTo(TARGET.widthM, 4)
    expect(size.y).toBeCloseTo(TARGET.heightM, 4)
    expect(size.z).toBeCloseTo(TARGET.depthM, 4)
  })

  test('rests on the floor and is centered on the origin', () => {
    const fitted = buildScannedGroup(createRawModel(0.4, 0.3, 0.2), TARGET, 0)

    const { box } = measure(fitted)

    expect(box.min.y).toBeCloseTo(0, 4)
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 4)
    expect((box.min.z + box.max.z) / 2).toBeCloseTo(0, 4)
  })

  test.each([[1], [2], [3]] as const)(
    'still matches the dimensions after %i quarter turn(s)',
    (quarterTurns) => {
      const fitted = buildScannedGroup(createRawModel(0.2, 0.3, 0.9), TARGET, quarterTurns)

      const { size, box } = measure(fitted)

      expect(size.x).toBeCloseTo(TARGET.widthM, 4)
      expect(size.y).toBeCloseTo(TARGET.heightM, 4)
      expect(size.z).toBeCloseTo(TARGET.depthM, 4)
      expect(box.min.y).toBeCloseTo(0, 4)
    },
  )

  test('does not mutate the source model', () => {
    const source = createRawModel(0.4, 0.3, 0.2)
    const before = measure(source).size.clone()

    buildScannedGroup(source, TARGET, 1)

    expect(measure(source).size.equals(before)).toBe(true)
    expect(source.parent).toBeNull()
  })
})

describe('suggestQuarterTurns', () => {
  test('keeps the model as is when its footprint already matches', () => {
    expect(suggestQuarterTurns([2, 1, 1], TARGET)).toBe(0)
  })

  test('turns the model when its long side is along the depth', () => {
    expect(suggestQuarterTurns([1, 1, 2], TARGET)).toBe(1)
  })
})

describe('hasRenderableGeometry', () => {
  test('accepts a model with a mesh of real volume', () => {
    expect(hasRenderableGeometry(createRawModel(1, 1, 1))).toBe(true)
  })

  test('rejects an empty scene', () => {
    expect(hasRenderableGeometry(new Group())).toBe(false)
  })
})
