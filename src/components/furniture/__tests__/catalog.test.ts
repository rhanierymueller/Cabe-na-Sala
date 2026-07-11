import { Box3, Vector3 } from 'three'
import { describe, expect, test } from 'vitest'
import { buildFurnitureGroup } from '../buildFurnitureGroup'
import { FURNITURE_CATALOG, FURNITURE_KINDS } from '../catalog'
import { dimensionsCmToMeters } from '../../../utils/units'

const HEIGHT_TOLERANCE_RATIO = 0.05
const WIDTH_TOLERANCE_M = 0.001

describe.each(FURNITURE_KINDS.map((kind) => [kind] as const))('%s', (kind) => {
  const definition = FURNITURE_CATALOG[kind]
  const dimensions = dimensionsCmToMeters(definition.defaultDimensionsCm)

  test('every part has strictly positive sizes', () => {
    const layout = definition.computeLayout(dimensions)

    expect(layout.length).toBeGreaterThan(0)
    layout.forEach((part) => {
      part.size.forEach((side) => expect(side).toBeGreaterThan(0))
    })
  })

  test('rests on the floor and matches the real width (escala real é sagrada)', () => {
    // Arrange & Act
    const group = buildFurnitureGroup(kind, dimensions)
    const boundingBox = new Box3().setFromObject(group)
    const size = boundingBox.getSize(new Vector3())

    // Assert
    expect(boundingBox.min.y).toBeCloseTo(0, 3)
    expect(Math.abs(size.x - dimensions.widthM)).toBeLessThanOrEqual(WIDTH_TOLERANCE_M)
    expect(Math.abs(size.y - dimensions.heightM)).toBeLessThanOrEqual(
      dimensions.heightM * HEIGHT_TOLERANCE_RATIO,
    )
    // Puxadores e botões podem se projetar à frente, como nos móveis reais.
    expect(size.z).toBeGreaterThanOrEqual(dimensions.depthM * 0.95)
  })

  test('scales proportionally when dimensions double', () => {
    const doubled = {
      widthM: dimensions.widthM * 2,
      heightM: dimensions.heightM * 2,
      depthM: dimensions.depthM * 2,
    }

    const baseSize = new Box3()
      .setFromObject(buildFurnitureGroup(kind, dimensions))
      .getSize(new Vector3())
    const doubledSize = new Box3()
      .setFromObject(buildFurnitureGroup(kind, doubled))
      .getSize(new Vector3())

    expect(doubledSize.x).toBeCloseTo(baseSize.x * 2, 3)
    expect(doubledSize.y).toBeCloseTo(baseSize.y * 2, 3)
  })
})

describe('stove specifics', () => {
  test('keeps the classic 18-part silhouette', () => {
    const dimensions = dimensionsCmToMeters(FURNITURE_CATALOG.stove.defaultDimensionsCm)
    const layout = FURNITURE_CATALOG.stove.computeLayout(dimensions)

    // 4 pés + corpo + tampo + 4 bocas + painel + 4 botões + porta + visor + puxador
    expect(layout).toHaveLength(18)
  })
})
