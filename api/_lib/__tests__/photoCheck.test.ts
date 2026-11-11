import { describe, expect, test } from 'vitest'
import { REJECTION_MESSAGES, REJECTION_REASONS, parseVerdict } from '../photoCheck.js'

describe('parseVerdict', () => {
  test('accepts an approval', () => {
    expect(parseVerdict({ ok: true, reason: null, kind: 'cabinet' })).toEqual({
      ok: true,
      kind: 'cabinet',
    })
  })

  test('an approval with an unknown kind gets no kind', () => {
    expect(parseVerdict({ ok: true, reason: null, kind: 'piano' })).toEqual({ ok: true, kind: null })
  })

  test.each(REJECTION_REASONS.map((reason) => [reason] as const))(
    'accepts a rejection with reason %s',
    (reason) => {
      expect(parseVerdict({ ok: false, reason })).toEqual({ ok: false, reason })
    },
  )

  test.each([
    ['loose text', 'sim, é um sofá'],
    ['a rejection with an unknown reason', { ok: false, reason: 'porque sim' }],
    ['a rejection without a reason', { ok: false, reason: null }],
    ['an ok that is not a boolean', { ok: 'true' }],
    ['nothing', undefined],
    ['null', null],
  ])('returns null for %s', (_label, output) => {
    expect(parseVerdict(output)).toBeNull()
  })
})

describe('REJECTION_MESSAGES', () => {
  test('every rejection reason has a message for the user', () => {
    REJECTION_REASONS.forEach((reason) => {
      expect(REJECTION_MESSAGES[reason].length).toBeGreaterThan(0)
    })
  })
})
