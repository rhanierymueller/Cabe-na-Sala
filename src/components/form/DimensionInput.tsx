import { AnimatePresence, motion } from 'framer-motion'
import { MAX_DIMENSION_CM, MIN_DIMENSION_CM } from '../../constants/dimensions'
import type { DimensionAxis } from '../../types/furniture'

interface DimensionInputProps {
  readonly axis: DimensionAxis
  readonly label: string
  readonly hint: string
  readonly value: string
  /** Valor válido atual em cm — alimenta o slider mesmo com texto inválido. */
  readonly sliderValueCm: number
  readonly errorMessage?: string
  readonly onChange: (axis: DimensionAxis, rawValue: string) => void
  readonly onBlur: (axis: DimensionAxis) => void
}

export function DimensionInput({
  axis,
  label,
  hint,
  value,
  sliderValueCm,
  errorMessage,
  onChange,
  onBlur,
}: DimensionInputProps) {
  const inputId = `dimension-${axis}`
  const hasError = Boolean(errorMessage)

  return (
    <div className="dimension-field">
      <label className="dimension-field__label" htmlFor={inputId}>
        {label}
        <span className="dimension-field__hint">{hint}</span>
      </label>

      <div className={`dimension-field__control${hasError ? ' dimension-field__control--error' : ''}`}>
        <input
          id={inputId}
          className="dimension-field__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          aria-invalid={hasError}
          onChange={(event) => onChange(axis, event.target.value)}
          onBlur={() => onBlur(axis)}
        />
        <span className="dimension-field__unit">cm</span>
      </div>

      <input
        className="dimension-field__slider"
        type="range"
        min={MIN_DIMENSION_CM}
        max={MAX_DIMENSION_CM}
        step={1}
        value={sliderValueCm}
        aria-label={`${label} (deslizar)`}
        onChange={(event) => onChange(axis, event.target.value)}
      />

      <AnimatePresence>
        {hasError && (
          <motion.p
            className="dimension-field__error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
