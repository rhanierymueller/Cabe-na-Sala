import { describe, expect, test } from 'vitest'
import { REJECTION_MESSAGES, REJECTION_REASONS, parseVerdict } from './photoCheck.js'

describe('parseVerdict', () => {
  test('aceita uma aprovação', () => {
    expect(parseVerdict({ ok: true, reason: null })).toEqual({ ok: true })
  })

  test.each(REJECTION_REASONS.map((reason) => [reason] as const))(
    'aceita uma recusa com o motivo %s',
    (reason) => {
      expect(parseVerdict({ ok: false, reason })).toEqual({ ok: false, reason })
    },
  )

  test.each([
    ['texto solto', 'sim, é um sofá'],
    ['recusa com motivo desconhecido', { ok: false, reason: 'porque sim' }],
    ['recusa sem motivo', { ok: false, reason: null }],
    ['ok que não é booleano', { ok: 'true' }],
    ['nada', undefined],
    ['null', null],
  ])('devolve null para %s', (_label, output) => {
    expect(parseVerdict(output)).toBeNull()
  })
})

describe('REJECTION_MESSAGES', () => {
  test('todo motivo de recusa tem mensagem para o usuário', () => {
    REJECTION_REASONS.forEach((reason) => {
      expect(REJECTION_MESSAGES[reason].length).toBeGreaterThan(0)
    })
  })
})
