import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import { useRef, useState } from 'react'

/** Movimento menor que isto é toque, não arrasto. */
const TAP_SLOP_PX = 6
/** Arrastar mais que isto numa direção decide abrir ou fechar. */
const SNAP_DISTANCE_PX = 56
/** Altura da folha aberta, como fração da tela (igual ao CSS). */
const OPEN_HEIGHT_RATIO = 0.86
/** Acima da altura recolhida + isto, a folha já mostra o conteúdo completo. */
const EXPANDED_LAYOUT_MARGIN_PX = 70
const FALLBACK_COLLAPSED_HEIGHT_PX = 300

interface Drag {
  readonly startY: number
  readonly startHeightPx: number
  hasMoved: boolean
}

export interface BottomSheet {
  /** A folha mostra o conteúdo completo (aberta ou sendo arrastada para cima). */
  readonly isExpanded: boolean
  readonly isOpen: boolean
  /** Altura imposta durante o arrasto; undefined deixa o CSS decidir. */
  readonly panelStyle: CSSProperties | undefined
  readonly handleProps: {
    readonly onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
    readonly onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
    readonly onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void
    readonly onPointerCancel: () => void
    readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void
  }
}

/**
 * Folha inferior do celular: toque na alça alterna, arrastar acompanha o dedo
 * e solta no estado mais próximo da intenção. A alça precisa ser filha direta
 * do painel, que é quem tem a altura medida.
 */
export function useBottomSheet(): BottomSheet {
  const [isOpen, setIsOpen] = useState(false)
  const [dragHeightPx, setDragHeightPx] = useState<number | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const collapsedHeightRef = useRef(FALLBACK_COLLAPSED_HEIGHT_PX)

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    const panel = event.currentTarget.parentElement
    if (!panel) return
    const heightPx = panel.getBoundingClientRect().height
    if (!isOpen) collapsedHeightRef.current = heightPx
    dragRef.current = { startY: event.clientY, startHeightPx: heightPx, hasMoved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>): void => {
    const drag = dragRef.current
    if (!drag) return
    const deltaPx = drag.startY - event.clientY
    if (!drag.hasMoved && Math.abs(deltaPx) < TAP_SLOP_PX) return

    drag.hasMoved = true
    const maxPx = window.innerHeight * OPEN_HEIGHT_RATIO
    setDragHeightPx(Math.min(maxPx, Math.max(collapsedHeightRef.current, drag.startHeightPx + deltaPx)))
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>): void => {
    const drag = dragRef.current
    dragRef.current = null
    setDragHeightPx(null)
    if (!drag) return
    if (!drag.hasMoved) {
      setIsOpen((current) => !current)
      return
    }
    const deltaPx = drag.startY - event.clientY
    if (deltaPx > SNAP_DISTANCE_PX) setIsOpen(true)
    else if (deltaPx < -SNAP_DISTANCE_PX) setIsOpen(false)
  }

  const handlePointerCancel = (): void => {
    dragRef.current = null
    setDragHeightPx(null)
  }

  // O toque já alterna no pointerup; o clique só vale para o teclado (detail 0).
  const handleClick = (event: MouseEvent<HTMLButtonElement>): void => {
    if (event.detail === 0) setIsOpen((current) => !current)
  }

  const isExpanded =
    dragHeightPx === null
      ? isOpen
      : dragHeightPx > collapsedHeightRef.current + EXPANDED_LAYOUT_MARGIN_PX

  return {
    isExpanded,
    isOpen,
    panelStyle:
      dragHeightPx === null
        ? undefined
        : { height: dragHeightPx, maxHeight: dragHeightPx, transition: 'none' },
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onClick: handleClick,
    },
  }
}
