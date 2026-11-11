import { ImagePlus } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { RoomPhotoStage } from './RoomPhotoStage'

interface RoomPhotoEntryProps {
  readonly kind: FurnitureKind
  readonly dimensions: DimensionsMeters
  readonly scannedModel: ScannedModel | null
}

/**
 * Botão "Ver na foto da minha sala". A foto fica só no aparelho: vira um
 * endereço local (blob) e nunca é enviada a servidor nenhum.
 */
export function RoomPhotoEntry({ kind, dimensions, scannedModel }: RoomPhotoEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (photoUrl === null) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const handleClose = useCallback(() => setPhotoUrl(null), [])

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    // Limpa o campo para a mesma foto poder ser escolhida de novo.
    event.target.value = ''
    if (file) setPhotoUrl(URL.createObjectURL(file))
  }

  return (
    <>
      <input
        ref={inputRef}
        className="photo-model__input"
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        aria-label="Escolher foto do ambiente"
        tabIndex={-1}
      />
      <button type="button" className="share__button room-entry" onClick={() => inputRef.current?.click()}>
        <ImagePlus size={16} aria-hidden="true" /> Ver na foto da minha sala
      </button>
      {photoUrl !== null &&
        // No body: o cartão que contém o botão usa backdrop-filter, que
        // prenderia um position: fixed dentro dele.
        createPortal(
          <RoomPhotoStage
            photoUrl={photoUrl}
            kind={kind}
            dimensions={dimensions}
            scannedModel={scannedModel}
            onClose={handleClose}
          />,
          document.body,
        )}
    </>
  )
}
