import { Camera } from 'lucide-react'
import { PHOTO_MODEL_INPUT_ID } from '../photo-model/PhotoModel'

/**
 * Atalho sob o botão principal, só no celular: com a folha recolhida o cartão
 * da foto do anúncio não aparece, e este botão abre o campo de arquivo dele.
 */
export function PhotoShortcut() {
  return (
    <button
      type="button"
      className="button button--block tool__photo-shortcut"
      onClick={() => document.getElementById(PHOTO_MODEL_INPUT_ID)?.click()}
    >
      <Camera size={16} aria-hidden="true" /> 3D pela foto
    </button>
  )
}
