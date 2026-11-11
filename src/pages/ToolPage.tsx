import { motion } from 'framer-motion'
import { ArrowLeft, Camera, ChevronUp } from 'lucide-react'
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
import { PHOTO_MODEL_INPUT_ID, PhotoModel } from '../components/tool/PhotoModel'
import { FurnitureViewer } from '../components/viewer/FurnitureViewer'
import { useBottomSheet } from '../hooks/useBottomSheet'
import { useDimensionsForm } from '../hooks/useDimensionsForm'
import type { DimensionsCm, FurnitureKind, ScannedModel } from '../types/furniture'
import { trackEvent } from '../utils/analytics'
import { clampDimensionCm } from '../utils/dimensionValidation'
import type { AdMeasures as FoundMeasures } from '../utils/measuresApi'
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
  // Só importa no celular: a folha de baixo, que abre por toque ou arrasto.
  const sheet = useBottomSheet()
  // Muda só quando a pessoa troca de móvel: remonta a foto do anúncio e cancela a geração.
  const [photoSession, setPhotoSession] = useState(0)
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
    setPhotoSession((session) => session + 1)
    setKind(nextKind)
    form.reset(FURNITURE_CATALOG[nextKind].defaultDimensionsCm)
  }

  /** O anúncio disse as medidas e, quando deu, que móvel é. */
  const handleAdRead = (found: FoundMeasures): void => {
    const nextKind = found.kind ?? kind
    // Medida que o anúncio não traz: a que está na tela, ou a padrão do móvel novo.
    const base =
      nextKind === kind ? form.dimensionsCm : FURNITURE_CATALOG[nextKind].defaultDimensionsCm
    if (nextKind !== kind) {
      handleScannedModelChange(null)
      setPhotoSession((session) => session + 1)
      setKind(nextKind)
    }
    form.reset({
      widthCm: clampDimensionCm(found.widthCm ?? base.widthCm),
      heightCm: clampDimensionCm(found.heightCm ?? base.heightCm),
      depthCm: clampDimensionCm(found.depthCm ?? base.depthCm),
    })
  }

  /**
   * A foto mostrou outro tipo de móvel. Troca o tipo sem cancelar a geração;
   * as medidas só mudam se ainda forem as padrão (ninguém digitou nada).
   */
  const handlePhotoKind = (detectedKind: FurnitureKind): void => {
    if (detectedKind === kind) return
    const defaults = definition.defaultDimensionsCm
    const isUntouched =
      form.dimensionsCm.widthCm === defaults.widthCm &&
      form.dimensionsCm.heightCm === defaults.heightCm &&
      form.dimensionsCm.depthCm === defaults.depthCm
    setKind(detectedKind)
    if (isUntouched) form.reset(FURNITURE_CATALOG[detectedKind].defaultDimensionsCm)
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
          <button
            type="button"
            className="app__back"
            onClick={onBackToLanding}
            title="Voltar ao início"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Cabe na Sala
          </button>
        </h1>
      </header>

      <FurniturePicker selectedKind={kind} onSelect={handleSelectKind} />

      <aside
        className={`tool__panel${sheet.isExpanded ? ' tool__panel--open' : ''}`}
        style={sheet.panelStyle}
      >
        <button
          type="button"
          className="tool__handle"
          aria-expanded={sheet.isOpen}
          {...sheet.handleProps}
        >
          <ChevronUp size={14} aria-hidden="true" />
          {sheet.isExpanded ? 'Fechar' : 'Anúncio, porta e ajustes'}
        </button>

        <div className="tool__scroll">
          <DimensionsForm form={form} furnitureLabel={definition.label}>
            <PhotoModel
              // Trocar de móvel à mão remonta o componente e cancela a geração em andamento.
              key={photoSession}
              dimensions={dimensionsMeters}
              model={scannedModel}
              onModelChange={handleScannedModelChange}
              onKindDetected={handlePhotoKind}
            />
          </DimensionsForm>

          <div className="tool__more">
            <AdMeasures onRead={handleAdRead} />

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
          <div className="tool__shortcuts">
            {/* Só no celular: com a folha recolhida, o cartão da foto do anúncio não aparece. */}
            <button
              type="button"
              className="share__button tool__photo-shortcut"
              onClick={() => document.getElementById(PHOTO_MODEL_INPUT_ID)?.click()}
            >
              <Camera size={16} aria-hidden="true" /> 3D pela foto
            </button>
            <RoomPhotoEntry kind={kind} dimensions={dimensionsMeters} scannedModel={scannedModel} />
          </div>
        </div>
      </aside>
    </motion.div>
  )
}
