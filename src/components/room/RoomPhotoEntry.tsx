import { ImagePlus } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DimensionsMeters, FurnitureKind, ScannedModel } from '../../types/furniture'
import { HiddenFileInput } from '../ui/HiddenFileInput'
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

  return (
    <>
      <HiddenFileInput
        ref={inputRef}
        accept="image/*"
        label="Escolher foto do ambiente"
        onFile={(file) => setPhotoUrl(URL.createObjectURL(file))}
      />
      <button
        type="button"
        className="button button--block room-entry"
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={16} aria-hidden="true" />
        <span className="room-entry__long">Ver na foto da minha sala</span>
        <span className="room-entry__short">Na foto da sala</span>
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
