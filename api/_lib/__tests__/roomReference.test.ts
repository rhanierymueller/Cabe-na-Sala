import { describe, expect, test } from 'vitest'
import { parseRoomReference } from '../roomReference.js'

const DOOR = {
  found: true,
  kind: 'door',
  bottomX: 0.7,
  bottomY: 0.82,
  topX: 0.7,
  topY: 0.2,
  heightCm: 210,
}

describe('parseRoomReference', () => {
  test('accepts a well-marked door', () => {
    expect(parseRoomReference(DOOR)).toEqual({
      kind: 'door',
      bottom: { x: 0.7, y: 0.82 },
      top: { x: 0.7, y: 0.2 },
      heightCm: 210,
    })
  })

  test.each([
    ['nothing was found', { ...DOOR, found: false }],
    ['the kind is unknown', { ...DOOR, kind: 'window' }],
    ['a point is outside the photo', { ...DOOR, bottomY: 1.4 }],
    ['a point is not a number', { ...DOOR, topX: null }],
    ['the top is below the bottom', { ...DOOR, topY: 0.9 }],
    ['the line is too short', { ...DOOR, topY: 0.8 }],
    ['the height is absurd', { ...DOOR, heightCm: 2100 }],
    ['the height is missing', { ...DOOR, heightCm: null }],
    ['the answer is not an object', 'porta'],
    ['there is nothing', null],
  ])('returns null when %s', (_label, output) => {
    expect(parseRoomReference(output)).toBeNull()
  })
})
