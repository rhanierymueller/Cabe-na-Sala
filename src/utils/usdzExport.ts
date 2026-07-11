import type { Object3D } from 'three'
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'

/**
 * Trava o gesto de pinça/escala no AR Quick Look — regra de produto:
 * escala real é sagrada; para "mudar o tamanho" o usuário edita as medidas.
 */
const SCALE_LOCK_FRAGMENT = '#allowsContentScaling=0'

const USDZ_MIME_TYPE = 'model/vnd.usdz+zip'

export interface UsdzExportResult {
  /** URL pronta para o AR Quick Look (com escala travada). */
  readonly arUrl: string
  /** Libera a memória do blob quando o modelo não for mais necessário. */
  readonly revoke: () => void
}

/**
 * Converte um objeto Three.js em um arquivo USDZ gerado no navegador,
 * retornando uma blob URL que o Safari abre direto no AR Quick Look.
 */
export async function exportObjectToUsdz(object: Object3D): Promise<UsdzExportResult> {
  const exporter = new USDZExporter()
  const usdzData = await exporter.parseAsync(object)
  const blob = new Blob([usdzData], { type: USDZ_MIME_TYPE })
  const blobUrl = URL.createObjectURL(blob)

  return {
    arUrl: `${blobUrl}${SCALE_LOCK_FRAGMENT}`,
    revoke: () => URL.revokeObjectURL(blobUrl),
  }
}

/**
 * Detecta suporte ao AR Quick Look (Safari no iPhone/iPad).
 */
export function isArQuickLookSupported(): boolean {
  const anchor = document.createElement('a')
  return anchor.relList.supports('ar')
}

/**
 * Abre o AR Quick Look. O Safari exige um <a rel="ar"> com um <img>
 * filho para tratar o link como experiência AR.
 */
export function openArQuickLook(arUrl: string): void {
  const anchor = document.createElement('a')
  anchor.rel = 'ar'
  anchor.href = arUrl
  anchor.appendChild(document.createElement('img'))
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
