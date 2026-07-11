import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, DoorOpen, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DimensionsCm } from '../../types/furniture'
import { trackEvent } from '../../utils/analytics'
import { clampDimensionCm, parseDimensionInput } from '../../utils/dimensionValidation'
import type { DoorFit } from '../../utils/doorFit'
import { computeDoorFit } from '../../utils/doorFit'

interface DoorCheckProps {
  readonly dimensionsCm: DimensionsCm
  readonly doorWidthCm: number | null
  readonly onDoorWidthChange: (doorWidthCm: number | null) => void
}

function formatGap(gapCm: number): string {
  const rounded = Math.round(Math.abs(gapCm) * 10) / 10
  return String(rounded).replace('.', ',')
}

function describeFit(fit: DoorFit): { icon: typeof CheckCircle2; text: string } {
  if (fit.status === 'blocked') {
    return { icon: XCircle, text: `Não passa — faltam ${formatGap(fit.gapCm)} cm` }
  }
  if (fit.status === 'tight') {
    return { icon: AlertTriangle, text: `Passa justo — sobram só ${formatGap(fit.gapCm)} cm` }
  }
  return { icon: CheckCircle2, text: `Passa na porta — sobram ${formatGap(fit.gapCm)} cm` }
}

/**
 * O veredito que transforma o visualizador em decisão: o usuário informa a
 * largura da porta/corredor e vê na hora se o móvel passa. O móvel atravessa
 * pelo menor lado horizontal (largura ou profundidade).
 */
export function DoorCheck({ dimensionsCm, doorWidthCm, onDoorWidthChange }: DoorCheckProps) {
  const [rawValue, setRawValue] = useState(doorWidthCm === null ? '' : String(doorWidthCm))
  const fit = doorWidthCm === null ? null : computeDoorFit(dimensionsCm, doorWidthCm)
  const fitStatus = fit?.status ?? null

  useEffect(() => {
    if (fitStatus !== null) trackEvent('verdict_shown', { status: fitStatus })
  }, [fitStatus])

  const handleChange = (nextRawValue: string): void => {
    setRawValue(nextRawValue)

    if (nextRawValue.trim() === '') {
      onDoorWidthChange(null)
      return
    }

    const parsedCm = parseDimensionInput(nextRawValue)
    if (parsedCm === null) return

    onDoorWidthChange(clampDimensionCm(parsedCm))
  }

  const verdict = fit === null ? null : describeFit(fit)

  return (
    <section className="door-check" aria-label="Vai passar na porta?">
      <label className="door-check__label" htmlFor="door-width">
        <DoorOpen size={15} aria-hidden="true" /> Vai passar na porta?
      </label>
      <input
        id="door-width"
        className="door-check__input"
        type="text"
        inputMode="decimal"
        placeholder="Largura da porta em cm (ex.: 80)"
        value={rawValue}
        onChange={(event) => handleChange(event.target.value)}
        aria-describedby={verdict === null ? undefined : 'door-verdict'}
      />

      <AnimatePresence mode="wait">
        {fit !== null && verdict !== null && (
          <motion.p
            id="door-verdict"
            key={fit.status}
            className={`door-check__badge door-check__badge--${fit.status}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            role="status"
          >
            <verdict.icon size={16} aria-hidden="true" /> {verdict.text}
          </motion.p>
        )}
      </AnimatePresence>

      {fit !== null && (
        <p className="door-check__explain">
          O móvel atravessa pelo menor lado: {formatGap(fit.neededCm)} cm.
        </p>
      )}
    </section>
  )
}
