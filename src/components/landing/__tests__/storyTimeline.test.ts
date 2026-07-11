import { describe, expect, test } from 'vitest'
import { STORY_CAPTIONS, computePortraitCompensation, sampleStoryFrame } from '../storyTimeline'

describe('sampleStoryFrame', () => {
  test('starts with the stove downstage, no kitchen and no labels', () => {
    const frame = sampleStoryFrame(0)

    expect(frame.stovePosition[2]).toBeCloseTo(0.85, 5)
    expect(frame.kitchenGrowth).toBe(0)
    expect(frame.areLabelsVisible).toBe(false)
  })

  test('completes a full turn by the end of the "giro" phase', () => {
    const frame = sampleStoryFrame(0.38)

    expect(frame.stoveRotationY).toBeCloseTo(Math.PI * 2, 5)
  })

  test('grows the kitchen fully mid-story', () => {
    expect(sampleStoryFrame(0.3).kitchenGrowth).toBe(0)
    expect(sampleStoryFrame(0.6).kitchenGrowth).toBe(1)
  })

  test('slides the stove into the kitchen gap with labels visible at the end', () => {
    const frame = sampleStoryFrame(0.9)

    expect(frame.stovePosition[2]).toBeCloseTo(0.01, 5)
    expect(frame.areLabelsVisible).toBe(true)
  })

  test('clamps progress outside the 0..1 range', () => {
    expect(sampleStoryFrame(-1)).toEqual(sampleStoryFrame(0))
    expect(sampleStoryFrame(2)).toEqual(sampleStoryFrame(1))
  })

  test('camera keeps a positive distance from the stove at every phase', () => {
    const PROBE_STEPS = 20
    for (let step = 0; step <= PROBE_STEPS; step += 1) {
      const frame = sampleStoryFrame(step / PROBE_STEPS)
      const [x, , z] = frame.cameraPosition
      expect(Math.hypot(x, z)).toBeGreaterThan(1)
    }
  })
})

describe('computePortraitCompensation', () => {
  test('leaves desktop (landscape) untouched', () => {
    const compensation = computePortraitCompensation(1.7)

    expect(compensation.distanceFactor).toBe(1)
    expect(compensation.lookAtYOffset).toBe(0)
  })

  test('pulls the camera back on portrait phones', () => {
    const compensation = computePortraitCompensation(0.46)

    expect(compensation.distanceFactor).toBeGreaterThan(1.5)
    expect(compensation.lookAtYOffset).toBeGreaterThan(0)
  })

  test('caps the distance factor on extremely narrow screens', () => {
    const compensation = computePortraitCompensation(0.1)

    expect(compensation.distanceFactor).toBeLessThanOrEqual(1.9)
  })

  test('grows the factor continuously as the screen narrows', () => {
    const tablet = computePortraitCompensation(1.0)
    const phone = computePortraitCompensation(0.5)

    expect(tablet.distanceFactor).toBeGreaterThan(1)
    expect(phone.distanceFactor).toBeGreaterThan(tablet.distanceFactor)
  })
})

describe('STORY_CAPTIONS', () => {
  test('caption windows are ordered and do not overlap', () => {
    for (let index = 0; index < STORY_CAPTIONS.length - 1; index += 1) {
      const [, currentEnd] = STORY_CAPTIONS[index].range
      const [nextStart] = STORY_CAPTIONS[index + 1].range
      expect(nextStart).toBeGreaterThanOrEqual(currentEnd)
    }
  })
})
