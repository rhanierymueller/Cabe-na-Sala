import { motion } from 'framer-motion'
import { ArrowLeft, ChevronUp } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ArButton } from '../components/ar/ArButton'
import { DimensionsForm } from '../components/form/DimensionsForm'
import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import { disposeModel } from '../components/furniture/scanned/loadModel'
import { ShareButton } from '../components/share/ShareButton'
import { RoomPhotoEntry } from '../components/room/RoomPhotoEntry'
import { AdMeasures } from '../components/tool/AdMeasures'
import { DoorCheck } from '../components/tool/DoorCheck'
import { FurniturePicker } from '../components/tool/FurniturePicker'
import { PhotoModel } from '../components/tool/PhotoModel'
import { FurnitureViewer } from '../components/viewer/FurnitureViewer'
import { useDimensionsForm } from '../hooks/useDimensionsForm'
import type { DimensionsCm, FurnitureKind, ScannedModel } from '../types/furniture'
import { trackEvent } from '../utils/analytics'
import { dimensionsCmToMeters } from '../utils/units'
import type { ToolUrlState } from '../utils/urlState'
import { buildToolSearch } from '../utils/urlState'

interface ToolPageProps {
  /** Estado vindo de um link compartilhado (`?movel=...`), se houver. */
  readonly initialState: ToolUrlState | null
  readonly onBackToLanding: () => void
  readonly onStateChange: (
    kind: FurnitureKind,
    dimensionsCm: DimensionsCm,
    doorWidthCm: number | null,
  ) => void
}

const FALLBACK_KIND: FurnitureKind = 'stove'

export function ToolPage({ initialState, onBackToLanding, onStateChange }: ToolPageProps) {
  const [kind, setKind] = useState<FurnitureKind>(initialState?.kind ?? FALLBACK_KIND)
  const [doorWidthCm, setDoorWidthCm] = useState<number | null>(initialState?.doorWidthCm ?? null)
  const [scannedModel, setScannedModel] = useState<ScannedModel | null>(null)
  // Só importa no celular: a folha de baixo recolhida ou aberta.
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const definition = FURNITURE_CATALOG[kind]
  const form = useDimensionsForm(initialState?.dimensionsCm ?? definition.defaultDimensionsCm)
  const dimensionsMeters = dimensionsCmToMeters(form.dimensionsCm)

  // Mantém a URL espelhando o estado — todo ajuste vira link compartilhável.
  useEffect(() => {
    onStateChange(kind, form.dimensionsCm, doorWidthCm)
  }, [kind, form.dimensionsCm, doorWidthCm, onStateChange])

  useEffect(() => {
    trackEvent('view_tool', { furniture: kind })
    // Dispara só na chegada — trocas de móvel já aparecem nos outros eventos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shareUrl = `${window.location.origin}${window.location.pathname}${buildToolSearch(kind, form.dimensionsCm, doorWidthCm)}`

  // Troca o modelo e libera a GPU do anterior (girar mantém a mesma cena).
  const handleScannedModelChange = useCallback((next: ScannedModel | null): void => {
    setScannedModel((current) => {
      if (current && current.scene !== next?.scene) disposeModel(current.scene)
      return next
    })
  }, [])

  const handleSelectKind = (nextKind: FurnitureKind): void => {
    // Tocar no móvel já ativo não pode apagar um modelo que custou uma geração.
    if (nextKind === kind) return
    // O modelo da foto pertence ao produto anterior.
    handleScannedModelChange(null)
    setKind(nextKind)
    form.reset(FURNITURE_CATALOG[nextKind].defaultDimensionsCm)
  }

  return (
    <motion.div
      className="tool"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="tool__canvas" aria-label="Visualização 3D do móvel">
        <p className="tool__backdrop" aria-hidden="true">
          {form.dimensionsCm.widthCm} × {form.dimensionsCm.heightCm} × {form.dimensionsCm.depthCm}
        </p>
        <FurnitureViewer kind={kind} dimensions={dimensionsMeters} scannedModel={scannedModel} />
      </div>

      <header className="tool__top">
        <h1 className="app__brand">
          <button type="button" className="app__back" onClick={onBackToLanding} title="Voltar ao início">
            <ArrowLeft size={18} aria-hidden="true" />
            Cabe na Sala
          </button>
        </h1>
      </header>

      <FurniturePicker selectedKind={kind} onSelect={handleSelectKind} />

      <aside className={`tool__panel${isSheetOpen ? ' tool__panel--open' : ''}`}>
        <button
          type="button"
          className="tool__handle"
          onClick={() => setIsSheetOpen((isOpen) => !isOpen)}
          aria-expanded={isSheetOpen}
        >
          <ChevronUp size={14} aria-hidden="true" />
          {isSheetOpen ? 'Fechar' : 'Anúncio, foto e porta'}
        </button>

        <div className="tool__scroll">
          <DimensionsForm form={form} furnitureLabel={definition.label} />

          <div className="tool__more">
            <AdMeasures dimensionsCm={form.dimensionsCm} onApply={form.reset} />

            <PhotoModel
              // Trocar de móvel remonta o componente e cancela a geração em andamento.
              key={kind}
              dimensions={dimensionsMeters}
              model={scannedModel}
              onModelChange={handleScannedModelChange}
            />

            <DoorCheck
              dimensionsCm={form.dimensionsCm}
              doorWidthCm={doorWidthCm}
              onDoorWidthChange={setDoorWidthCm}
            />

            <ShareButton
              furnitureLabel={definition.label}
              dimensionsCm={form.dimensionsCm}
              doorWidthCm={doorWidthCm}
              shareUrl={shareUrl}
            />

            <p className="tool__footer">Cada quadrado do chão mede 10 cm. Cotas em centímetros.</p>
          </div>
        </div>

        <div className="tool__cta">
          <ArButton
            kind={kind}
            dimensions={dimensionsMeters}
            handoffUrl={shareUrl}
            scannedModel={scannedModel}
          />
          <RoomPhotoEntry kind={kind} dimensions={dimensionsMeters} scannedModel={scannedModel} />
        </div>
      </aside>
    </motion.div>
  )
}
