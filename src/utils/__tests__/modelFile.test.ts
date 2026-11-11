import { describe, expect, test } from 'vitest'
import { isGlbFile, validateModelFile } from '../modelFile'

const MB = 1024 * 1024

describe('validateModelFile', () => {
  test('accepts a photo within the size limit', () => {
    expect(validateModelFile({ name: 'sofa.jpg', type: 'image/jpeg', size: 3 * MB })).toBeNull()
  })

  test('accepts any image the browser can open, since it is re-encoded as JPEG', () => {
    expect(validateModelFile({ name: 'sofa.heic', type: 'image/heic', size: 2 * MB })).toBeNull()
  })

  test('rejects a vector image', () => {
    expect(validateModelFile({ name: 'logo.svg', type: 'image/svg+xml', size: 1000 })).toMatch(/JPG/)
  })

  test('rejects a file that is not an image', () => {
    expect(validateModelFile({ name: 'nota.txt', type: 'text/plain', size: 10 })).toMatch(/JPG/)
  })

  test('rejects a photo above 15 MB', () => {
    expect(validateModelFile({ name: 'sofa.png', type: 'image/png', size: 16 * MB })).toMatch(/15 MB/)
  })

  test('accepts a .glb model whatever its declared type', () => {
    expect(validateModelFile({ name: 'Sofa.GLB', type: '', size: 10 * MB })).toBeNull()
  })

  test('rejects a .glb model above 40 MB', () => {
    expect(validateModelFile({ name: 'sofa.glb', type: '', size: 41 * MB })).toMatch(/40 MB/)
  })
})

describe('isGlbFile', () => {
  test('recognizes the extension regardless of case', () => {
    expect(isGlbFile({ name: 'modelo.GlB' })).toBe(true)
    expect(isGlbFile({ name: 'modelo.gltf' })).toBe(false)
  })
})
