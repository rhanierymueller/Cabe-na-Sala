import { CanvasTexture, RepeatWrapping } from 'three'

const WEAVE_SIZE_PX = 128
const WEAVE_REPEAT = 10

let weaveTexture: CanvasTexture | null = null

/** Trama de tecido gerada em código: ruído fino que dá toque ao estofado sem baixar textura. */
export function getWeaveTexture(): CanvasTexture {
  if (weaveTexture) return weaveTexture

  const canvas = document.createElement('canvas')
  canvas.width = WEAVE_SIZE_PX
  canvas.height = WEAVE_SIZE_PX
  const context = canvas.getContext('2d')
  if (context) {
    for (let y = 0; y < WEAVE_SIZE_PX; y += 1) {
      for (let x = 0; x < WEAVE_SIZE_PX; x += 1) {
        const thread = (x + y) % 4 < 2 ? 150 : 105
        const shade = thread + Math.random() * 50
        context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`
        context.fillRect(x, y, 1, 1)
      }
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(WEAVE_REPEAT, WEAVE_REPEAT)
  weaveTexture = texture
  return texture
}
