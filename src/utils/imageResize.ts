/** Lado máximo enviado ao gerador — acima disso só encarece e demora. */
export const MAX_UPLOAD_SIDE_PX = 1024
const JPEG_QUALITY = 0.88
const OUTPUT_MIME_TYPE = 'image/jpeg'
/** Fundo branco para PNG/WebP transparente — o gerador recorta melhor assim. */
const BACKGROUND_COLOR = '#ffffff'

export interface PixelSize {
  readonly widthPx: number
  readonly heightPx: number
}

/** Reduz mantendo a proporção; nunca amplia. */
export function computeResizedSize(original: PixelSize, maxSidePx: number): PixelSize {
  const largestSidePx = Math.max(original.widthPx, original.heightPx)
  if (largestSidePx <= maxSidePx) return original

  const ratio = maxSidePx / largestSidePx
  return {
    widthPx: Math.max(1, Math.round(original.widthPx * ratio)),
    heightPx: Math.max(1, Math.round(original.heightPx * ratio)),
  }
}

/**
 * Converte a foto escolhida em um JPEG pequeno (data URL) pronto para envio.
 * Roda só no navegador.
 */
export async function resizeImageToDataUrl(
  file: Blob,
  maxSidePx: number = MAX_UPLOAD_SIDE_PX,
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const target = computeResizedSize({ widthPx: bitmap.width, heightPx: bitmap.height }, maxSidePx)
    const canvas = document.createElement('canvas')
    canvas.width = target.widthPx
    canvas.height = target.heightPx

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D indisponível neste navegador')

    context.fillStyle = BACKGROUND_COLOR
    context.fillRect(0, 0, target.widthPx, target.heightPx)
    context.drawImage(bitmap, 0, 0, target.widthPx, target.heightPx)
    return canvas.toDataURL(OUTPUT_MIME_TYPE, JPEG_QUALITY)
  } finally {
    bitmap.close()
  }
}
