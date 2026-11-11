import type { KeyboardEvent, PointerEvent } from 'react'
import { useRef } from 'react'
import type { PhotoPoint, PhotoSize, ReferenceLine } from '../../utils/roomPhoto'
import { clampToPhoto, photoPointFromClient } from '../../utils/roomPhoto'

interface RoomCalibratorProps {
  readonly size: PhotoSize
  readonly line: ReferenceLine
  readonly label: string
  readonly onChange: (line: ReferenceLine) => void
}

type Handle = keyof ReferenceLine

const HANDLES: readonly Handle[] = ['bottom', 'top']
const HANDLE_LABELS: Readonly<Record<Handle, string>> = {
  bottom: 'Ponta no chão. Use as setas para mover.',
  top: 'Ponta no topo. Use as setas para mover.',
}
/** Tamanhos relativos ao lado maior da foto, para não depender da resolução. */
const HANDLE_RADIUS_RATIO = 0.016
const HIT_RADIUS_RATIO = 0.06
const STROKE_RATIO = 0.004
const HALO_STROKE_FACTOR = 2.4
const LABEL_OFFSET_RATIO = 0.03
const LABEL_FONT_RATIO = 0.034
const LABEL_STROKE_RATIO = 0.008
/** Passo das setas do teclado, como fração do lado maior. */
const KEY_STEP_RATIO = 0.01
const KEY_DIRECTIONS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

interface ReferenceHandleProps {
  readonly handle: Handle
  readonly point: PhotoPoint
  readonly size: PhotoSize
  readonly longSide: number
  readonly onMove: (handle: Handle, event: PointerEvent<SVGCircleElement>) => void
  readonly onKeyDown: (handle: Handle, event: KeyboardEvent<SVGCircleElement>) => void
}

/** Uma ponta da linha: o ponto visível e uma área de toque bem maior em volta. */
function ReferenceHandle({ handle, point, size, longSide, onMove, onKeyDown }: ReferenceHandleProps) {
  return (
    <g>
      <circle
        className="room__handle-dot"
        cx={point.x}
        cy={point.y}
        r={longSide * HANDLE_RADIUS_RATIO}
        strokeWidth={longSide * STROKE_RATIO}
      />
      <circle
        className="room__handle-hit"
        cx={point.x}
        cy={point.y}
        r={longSide * HIT_RADIUS_RATIO}
        role="slider"
        tabIndex={0}
        aria-label={HANDLE_LABELS[handle]}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={Math.round(size.heightPx)}
        aria-valuenow={Math.round(point.y)}
        onKeyDown={(event) => onKeyDown(handle, event)}
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={(event) => onMove(handle, event)}
      />
    </g>
  )
}

/**
 * Linha de referência sobre a foto: duas alças arrastáveis, uma no chão e
 * outra no topo de algo com altura conhecida.
 */
export function RoomCalibrator({ size, line, label, onChange }: RoomCalibratorProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const longSide = Math.max(size.widthPx, size.heightPx)

  const handleMove = (handle: Handle, event: PointerEvent<SVGCircleElement>): void => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    const point = photoPointFromClient(event.clientX, event.clientY, rect, size)
    if (point) onChange({ ...line, [handle]: point })
  }

  const handleKeyDown = (handle: Handle, event: KeyboardEvent<SVGCircleElement>): void => {
    const direction = KEY_DIRECTIONS[event.key]
    if (!direction) return
    event.preventDefault()

    const stepPx = longSide * KEY_STEP_RATIO
    const current = line[handle]
    const moved = { x: current.x + direction[0] * stepPx, y: current.y + direction[1] * stepPx }
    onChange({ ...line, [handle]: clampToPhoto(moved, size) })
  }

  const ends = { x1: line.bottom.x, y1: line.bottom.y, x2: line.top.x, y2: line.top.y }

  return (
    <svg
      ref={svgRef}
      className="room__calibrator"
      viewBox={`0 0 ${size.widthPx} ${size.heightPx}`}
      preserveAspectRatio="none"
    >
      <line className="room__line room__line--halo" {...ends} strokeWidth={longSide * STROKE_RATIO * HALO_STROKE_FACTOR} />
      <line className="room__line" {...ends} strokeWidth={longSide * STROKE_RATIO} />
      <text
        className="room__line-label"
        x={(line.bottom.x + line.top.x) / 2 + longSide * LABEL_OFFSET_RATIO}
        y={(line.bottom.y + line.top.y) / 2}
        fontSize={longSide * LABEL_FONT_RATIO}
        strokeWidth={longSide * LABEL_STROKE_RATIO}
      >
        {label}
      </text>
      {HANDLES.map((handle) => (
        <ReferenceHandle
          key={handle}
          handle={handle}
          point={line[handle]}
          size={size}
          longSide={longSide}
          onMove={handleMove}
          onKeyDown={handleKeyDown}
        />
      ))}
    </svg>
  )
}
