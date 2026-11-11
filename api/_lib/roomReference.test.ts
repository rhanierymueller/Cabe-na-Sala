import { describe, expect, test } from 'vitest'
import { parseRoomReference } from './roomReference.js'

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
  test('aceita uma porta bem marcada', () => {
    expect(parseRoomReference(DOOR)).toEqual({
      kind: 'door',
      bottom: { x: 0.7, y: 0.82 },
      top: { x: 0.7, y: 0.2 },
      heightCm: 210,
    })
  })

  test.each([
    ['não encontrou', { ...DOOR, found: false }],
    ['tipo desconhecido', { ...DOOR, kind: 'window' }],
    ['ponto fora da foto', { ...DOOR, bottomY: 1.4 }],
    ['ponto que não é número', { ...DOOR, topX: null }],
    ['topo abaixo da base', { ...DOOR, topY: 0.9 }],
    ['linha curta demais', { ...DOOR, topY: 0.8 }],
    ['altura absurda', { ...DOOR, heightCm: 2100 }],
    ['altura ausente', { ...DOOR, heightCm: null }],
    ['resposta que não é objeto', 'porta'],
    ['nada', null],
  ])('devolve null quando %s', (_label, output) => {
    expect(parseRoomReference(output)).toBeNull()
  })
})
