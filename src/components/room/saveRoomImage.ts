import { isAbortError } from '../../utils/abort'

const MAX_OUTPUT_SIDE_PX = 1600
const OUTPUT_QUALITY = 0.9
const FILE_NAME = 'cabe-na-sala.jpg'

function toJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem'))),
      'image/jpeg',
      OUTPUT_QUALITY,
    )
  })
}

/**
 * Junta a foto e o móvel 3D em uma imagem só e entrega pelo compartilhar do
 * celular; onde não existe, baixa o arquivo.
 */
export async function saveRoomImage(photo: HTMLImageElement, furniture: HTMLCanvasElement): Promise<void> {
  const scale = Math.min(1, MAX_OUTPUT_SIDE_PX / Math.max(photo.naturalWidth, photo.naturalHeight))
  const output = document.createElement('canvas')
  output.width = Math.round(photo.naturalWidth * scale)
  output.height = Math.round(photo.naturalHeight * scale)

  const context = output.getContext('2d')
  if (!context) throw new Error('Canvas 2D indisponível')
  context.drawImage(photo, 0, 0, output.width, output.height)
  context.drawImage(furniture, 0, 0, output.width, output.height)

  const file = new File([await toJpegBlob(output)], FILE_NAME, { type: 'image/jpeg' })

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Cabe na Sala' })
    } catch (error: unknown) {
      if (!isAbortError(error)) throw error
    }
    return
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = FILE_NAME
  link.click()
  URL.revokeObjectURL(url)
}
