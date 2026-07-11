import { FURNITURE_CATALOG } from '../components/furniture/catalog'
import type { DimensionAxis, DimensionsCm, FurnitureKind } from '../types/furniture'
import { clampDimensionCm, parseDimensionInput } from './dimensionValidation'

/**
 * Estado da ferramenta serializado na URL (`?movel=fogao&l=60&a=87&p=63`).
 * É o que torna cada configuração um link compartilhável: WhatsApp, QR de
 * handoff desktop→celular e futuras páginas de SEO por móvel.
 */
export interface ToolUrlState {
  readonly kind: FurnitureKind
  readonly dimensionsCm: DimensionsCm
}

const KIND_PARAM = 'movel'

/** Slugs em português — são a parte visível do link compartilhado. */
const KIND_TO_SLUG: Record<FurnitureKind, string> = {
  stove: 'fogao',
  sofa: 'sofa',
  fridge: 'geladeira',
  wardrobe: 'guarda-roupa',
  bed: 'cama',
  table: 'mesa',
}

const SLUG_TO_KIND: ReadonlyMap<string, FurnitureKind> = new Map(
  (Object.entries(KIND_TO_SLUG) as [FurnitureKind, string][]).map(([kind, slug]) => [slug, kind]),
)

/** l = largura, a = altura, p = profundidade — abreviações pt-BR do form. */
const AXIS_TO_PARAM: Record<DimensionAxis, string> = {
  widthCm: 'l',
  heightCm: 'a',
  depthCm: 'p',
}

function parseAxis(params: URLSearchParams, axis: DimensionAxis, fallbackCm: number): number {
  const rawValue = params.get(AXIS_TO_PARAM[axis])
  if (rawValue === null) return fallbackCm

  const parsedCm = parseDimensionInput(rawValue)
  if (parsedCm === null) return fallbackCm

  return clampDimensionCm(parsedCm)
}

/**
 * Lê o estado da ferramenta de uma query string. Retorna null quando a URL
 * não aponta para a ferramenta (sem `movel` ou com slug desconhecido);
 * medidas ausentes/inválidas caem no padrão do catálogo, fora dos limites
 * são normalizadas (clamp).
 */
export function parseToolUrl(search: string): ToolUrlState | null {
  const params = new URLSearchParams(search)
  const slug = params.get(KIND_PARAM)
  if (slug === null) return null

  const kind = SLUG_TO_KIND.get(slug)
  if (kind === undefined) return null

  const defaults = FURNITURE_CATALOG[kind].defaultDimensionsCm

  return {
    kind,
    dimensionsCm: {
      widthCm: parseAxis(params, 'widthCm', defaults.widthCm),
      heightCm: parseAxis(params, 'heightCm', defaults.heightCm),
      depthCm: parseAxis(params, 'depthCm', defaults.depthCm),
    },
  }
}

function formatCm(valueCm: number): string {
  // Vírgula decimal no link — é o formato que o usuário brasileiro reconhece.
  return String(valueCm).replace('.', ',')
}

/** Serializa o estado da ferramenta como query string canônica. */
export function buildToolSearch(kind: FurnitureKind, dimensionsCm: DimensionsCm): string {
  const params = new URLSearchParams()
  params.set(KIND_PARAM, KIND_TO_SLUG[kind])
  params.set(AXIS_TO_PARAM.widthCm, formatCm(dimensionsCm.widthCm))
  params.set(AXIS_TO_PARAM.heightCm, formatCm(dimensionsCm.heightCm))
  params.set(AXIS_TO_PARAM.depthCm, formatCm(dimensionsCm.depthCm))

  return `?${params.toString()}`
}
