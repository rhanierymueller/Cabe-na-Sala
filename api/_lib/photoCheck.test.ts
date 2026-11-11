import { describe, expect, test } from 'vitest'
import { REJECTION_MESSAGES, REJECTION_REASONS, parseVerdict } from './photoCheck.js'

describe('parseVerdict', () => {
  test('accepts an approval', () => {
    expect(parseVerdict('{"ok": true}')).toEqual({ ok: true })
  })

  test.each(REJECTION_REASONS.map((reason) => [reason] as const))(
    'accepts a rejection with reason %s',
    (reason) => {
      expect(parseVerdict(`{"ok": false, "reason": "${reason}"}`)).toEqual({ ok: false, reason })
    },
  )

  test('finds the JSON even when the model wraps it in text or a code fence', () => {
    expect(parseVerdict('Claro!\n```json\n{"ok": false, "reason": "person"}\n```')).toEqual({
      ok: false,
      reason: 'person',
    })
  })

  test.each([
    ['plain text', 'sim, é um sofá'],
    ['a rejection without a known reason', '{"ok": false, "reason": "porque sim"}'],
    ['a rejection without reason', '{"ok": false}'],
    ['ok that is not a boolean', '{"ok": "true"}'],
    ['broken JSON', '{"ok": tru'],
    ['a non-string', { ok: true }],
    ['nothing', undefined],
  ])('returns null for %s', (_label, output) => {
    expect(parseVerdict(output)).toBeNull()
  })
})

describe('REJECTION_MESSAGES', () => {
  test('has a user-facing message for every reason', () => {
    REJECTION_REASONS.forEach((reason) => {
      expect(REJECTION_MESSAGES[reason].length).toBeGreaterThan(10)
    })
  })
})
