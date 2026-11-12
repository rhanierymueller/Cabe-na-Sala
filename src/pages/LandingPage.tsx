import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { HeroStage } from '../components/landing/HeroStage'
import { FurniturePicker } from '../components/tool/FurniturePicker'
import { DIMENSION_FIELDS } from '../constants/dimensions'
import { COPYRIGHT_NOTICE } from '../constants/site'
import { trackEvent } from '../services/analytics'
import type { DimensionAxis, DimensionsCm, FurnitureKind } from '../types/furniture'
import { clampDimensionCm, parseDimensionInput } from '../utils/dimensionValidation'
import { dimensionsCmToMeters } from '../utils/units'

interface LandingPageProps {
  /** Abre a ferramenta com o móvel e as medidas montados aqui. */
  readonly onStart: (kind: FurnitureKind, dimensionsCm: DimensionsCm) => void
}

const INITIAL_KIND: FurnitureKind = 'sofa'

type DimensionTexts = Record<DimensionAxis, string>

function toTexts(dimensions: DimensionsCm): DimensionTexts {
  return {
    widthCm: String(dimensions.widthCm),
    heightCm: String(dimensions.heightCm),
    depthCm: String(dimensions.depthCm),
  }
}

/**
 * A landing é uma dobra só: o móvel grande, em luz de produto, o seletor de
 * móveis e três números para mexer. Tudo o mais (foto do anúncio, AR)
 * fica na ferramenta, para onde o botão leva com estas medidas.
 */
export function LandingPage({ onStart }: LandingPageProps) {
  const [kind, setKind] = useState<FurnitureKind>(INITIAL_KIND)
  const [dimensionsCm, setDimensionsCm] = useState<DimensionsCm>(
    FURNITURE_CATALOG[INITIAL_KIND].defaultDimensionsCm,
  )
  // O texto do campo anda solto (pode ficar vazio enquanto a pessoa digita);
  // o móvel só muda quando o texto vira uma medida válida.
  const [texts, setTexts] = useState<DimensionTexts>(() => toTexts(dimensionsCm))

  useEffect(() => {
    trackEvent('view_landing')
  }, [])

  const handleKindChange = (nextKind: FurnitureKind) => {
    const defaults = FURNITURE_CATALOG[nextKind].defaultDimensionsCm
    if (nextKind !== kind) trackEvent('select_furniture', { furniture: nextKind, where: 'landing' })
    setKind(nextKind)
    setDimensionsCm(defaults)
    setTexts(toTexts(defaults))
  }

  const handleDimensionChange = (axis: DimensionAxis, rawValue: string) => {
    setTexts((current) => ({ ...current, [axis]: rawValue }))
    const parsed = parseDimensionInput(rawValue)
    if (parsed === null) return
    setDimensionsCm((current) => ({ ...current, [axis]: clampDimensionCm(parsed) }))
  }

  return (
    <motion.main
      className="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="landing__stage">
        <HeroStage kind={kind} dimensions={dimensionsCmToMeters(dimensionsCm)} />
      </div>

      <header className="landing__head">
        <p className="landing__brand">Cabe na Sala</p>
        <h1 className="landing__title">Vai caber?</h1>
        <p className="landing__lead">
          Digite as medidas do anúncio. O móvel aparece no tamanho real, ao lado de uma pessoa de
          1,70&nbsp;m.
        </p>
      </header>

      <FurniturePicker selectedKind={kind} onSelect={handleKindChange} />

      <form
        className="landing__dock"
        onSubmit={(event) => {
          event.preventDefault()
          const defaults = FURNITURE_CATALOG[kind].defaultDimensionsCm
          const hasChangedMeasures = DIMENSION_FIELDS.some(({ axis }) => dimensionsCm[axis] !== defaults[axis])
          trackEvent('landing_start', { furniture: kind, changed_measures: hasChangedMeasures })
          onStart(kind, dimensionsCm)
        }}
      >
        <div className="landing__fields">
          {DIMENSION_FIELDS.map((field) => (
            <label key={field.axis} className="landing__field">
              <span className="landing__label">{field.label}</span>
              <span className="landing__value">
                <input
                  id={`landing-${field.axis}`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={texts[field.axis]}
                  onChange={(event) => handleDimensionChange(field.axis, event.target.value)}
                  onFocus={(event) => event.target.select()}
                />
                <span className="landing__unit">cm</span>
              </span>
            </label>
          ))}
        </div>

        <button type="submit" className="button button--primary button--large">
          Ver na minha casa
        </button>
      </form>

      <p className="landing__hint">Arraste o móvel para girar</p>
      <footer className="landing__copyright">{COPYRIGHT_NOTICE}</footer>
    </motion.main>
  )
}
