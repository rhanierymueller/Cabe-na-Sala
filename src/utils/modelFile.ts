/**
 * O que o seletor da foto do anúncio aceita: uma foto (que o servidor
 * transforma em 3D) ou, para quem já tem, um modelo .glb pronto.
 */

const ACCEPTED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']
const GLB_EXTENSION = '.glb'
const BYTES_PER_MB = 1024 * 1024
const MAX_IMAGE_SIZE_MB = 15
const MAX_MODEL_SIZE_MB = 40

/** Para o botão da câmera: só imagem. */
export const CAMERA_ACCEPT = 'image/*'

/** Entrada do seletor de arquivo: fotos e modelo .glb. */
export const PHOTO_MODEL_ACCEPT = [...ACCEPTED_IMAGE_TYPES, GLB_EXTENSION].join(',')

export function isGlbFile(file: Pick<File, 'name'>): boolean {
  return file.name.toLowerCase().endsWith(GLB_EXTENSION)
}

/** Recusa cedo o que não serve, com mensagem que diz o que fazer; null quando serve. */
export function validateModelFile(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (isGlbFile(file)) {
    return file.size > MAX_MODEL_SIZE_MB * BYTES_PER_MB
      ? `O modelo passa de ${MAX_MODEL_SIZE_MB} MB.`
      : null
  }
  // O navegador reconverte para JPEG antes do envio; basta ser uma imagem que ele abra.
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return 'Use uma foto JPG, PNG ou WebP.'
  }
  if (file.size > MAX_IMAGE_SIZE_MB * BYTES_PER_MB) return `A foto passa de ${MAX_IMAGE_SIZE_MB} MB.`
  return null
}
