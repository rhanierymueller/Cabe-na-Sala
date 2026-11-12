import { describe, expect, test, vi } from 'vitest'
import { createModelCache } from '../modelCache'

describe('createModelCache', () => {
  test('is still loading before anything arrives', () => {
    const cache = createModelCache(() => new Promise<string>(() => undefined))

    expect(cache.peek()).toEqual({ status: 'loading' })
  })

  test('loads only once no matter how many scenes ask for it', async () => {
    const load = vi.fn(() => Promise.resolve('person'))
    const cache = createModelCache(load)

    await Promise.all([cache.request(), cache.request()])
    await cache.request()

    expect(load).toHaveBeenCalledTimes(1)
  })

  test('hands the model over at once to a scene that mounts after it loaded', async () => {
    const cache = createModelCache(() => Promise.resolve('person'))

    await cache.request()

    expect(cache.peek()).toEqual({ status: 'ready', model: 'person' })
  })

  test('reports failure instead of throwing, so the scene can fall back', async () => {
    const cache = createModelCache(() => Promise.reject(new Error('missing file')))

    await expect(cache.request()).resolves.toEqual({ status: 'failed' })
    expect(cache.peek()).toEqual({ status: 'failed' })
  })
})
