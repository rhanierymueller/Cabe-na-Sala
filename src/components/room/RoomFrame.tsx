import type { CSSProperties, ReactNode, Ref } from 'react'
import type { PhotoSize } from '../../utils/roomPhoto'

interface RoomFrameProps {
  readonly photoUrl: string
  readonly photoRef: Ref<HTMLImageElement>
  readonly frameRef: Ref<HTMLDivElement>
  /** Tamanho original da foto; null até ela carregar. */
  readonly size: PhotoSize | null
  readonly onPhotoLoad: () => void
  readonly onPhotoError: () => void
  /** O que o passo atual desenha por cima da foto. */
  readonly children: ReactNode
}

/** Espaço reservado para a barra de controles ao encaixar a foto na tela. */
const BAR_SPACE_PX = 250

/** A foto inteira na tela, sem deformar, deixando lugar para a barra de baixo. */
function frameStyle(size: PhotoSize | null): CSSProperties | undefined {
  if (!size) return undefined
  return {
    aspectRatio: `${size.widthPx} / ${size.heightPx}`,
    width: `min(100vw, calc((100dvh - ${BAR_SPACE_PX}px) * ${size.widthPx / size.heightPx}))`,
  }
}

/** A foto do cômodo encaixada na tela, com a camada do passo atual por cima. */
export function RoomFrame({ photoUrl, photoRef, frameRef, size, onPhotoLoad, onPhotoError, children }: RoomFrameProps) {
  return (
    <div className="room__viewport">
      <div ref={frameRef} className="room__frame" style={frameStyle(size)}>
        <img
          ref={photoRef}
          className="room__photo"
          src={photoUrl}
          alt="Foto do ambiente"
          onLoad={onPhotoLoad}
          onError={onPhotoError}
        />
        {children}
      </div>
    </div>
  )
}
