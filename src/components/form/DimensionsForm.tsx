import { motion } from 'framer-motion'
import { DIMENSION_FIELDS } from '../../constants/dimensions'
import type { DimensionsForm as DimensionsFormValues } from '../../hooks/useDimensionsForm'
import { DimensionInput } from './DimensionInput'

interface DimensionsFormProps {
  readonly form: DimensionsFormValues
  readonly furnitureLabel: string
}

export function DimensionsForm({ form, furnitureLabel }: DimensionsFormProps) {
  const { dimensionsCm, fieldValues, fieldErrors, handleFieldChange, handleFieldBlur } = form

  return (
    <motion.section
      className="dimensions-form"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      aria-label="Medidas do móvel"
    >
      <h2 className="dimensions-form__title">Medidas — {furnitureLabel}</h2>
      <p className="dimensions-form__subtitle">
        Copie as medidas do anúncio e veja o móvel se ajustar na hora.
      </p>

      <div className="dimensions-form__fields">
        {DIMENSION_FIELDS.map(({ axis, label, hint }) => (
          <DimensionInput
            key={axis}
            axis={axis}
            label={label}
            hint={hint}
            value={fieldValues[axis]}
            sliderValueCm={dimensionsCm[axis]}
            errorMessage={fieldErrors[axis]}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        ))}
      </div>

      <motion.p
        className="dimensions-form__summary"
        key={`${dimensionsCm.widthCm}-${dimensionsCm.heightCm}-${dimensionsCm.depthCm}`}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {dimensionsCm.widthCm} × {dimensionsCm.heightCm} × {dimensionsCm.depthCm} cm
      </motion.p>
    </motion.section>
  )
}
