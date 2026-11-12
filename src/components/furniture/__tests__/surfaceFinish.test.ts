import { describe, expect, test } from 'vitest'
import { MATERIALS } from '../parts'
import { describeSurfaceFinish } from '../surfaceFinish'

describe('describeSurfaceFinish', () => {
  test('gives fabric a velvet sheen and a weave', () => {
    const finish = describeSurfaceFinish(MATERIALS.fabricSeat)

    expect(finish.hasWeave).toBe(true)
    expect(finish.sheen).toBeGreaterThan(0)
    expect(finish.clearcoat).toBe(0)
  })

  test('gives polished surfaces a clear coat and no weave', () => {
    const finish = describeSurfaceFinish(MATERIALS.blackGlass)

    expect(finish.clearcoat).toBeGreaterThan(0)
    expect(finish.hasWeave).toBe(false)
    expect(finish.sheen).toBe(0)
  })

  test('leaves wood and brushed steel as they are', () => {
    expect(describeSurfaceFinish(MATERIALS.oak)).toEqual({ sheen: 0, clearcoat: 0, hasWeave: false })
    expect(describeSurfaceFinish(MATERIALS.inox)).toEqual({ sheen: 0, clearcoat: 0, hasWeave: false })
  })
})
