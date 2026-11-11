/**
 * Tipos de móvel que o site sabe desenhar. O modelo escolhe um deles (ou
 * nenhum); quem valida a resposta é este arquivo. Tem de acompanhar
 * `FurnitureKind` em src/types/furniture.ts.
 */

const FURNITURE_KIND_VALUES = [
  'stove',
  'sofa',
  'fridge',
  'wardrobe',
  'bed',
  'table',
  'cabinet',
  'frame',
] as const
export type DetectedKind = (typeof FURNITURE_KIND_VALUES)[number]

export const KIND_GUIDANCE = [
  'Em "kind", diga qual destes tipos é o produto, ou null se nenhum servir:',
  'stove = fogão ou cooktop de piso; fridge = geladeira ou freezer; sofa = sofá ou poltrona;',
  'wardrobe = guarda-roupa, roupeiro ou armário alto; bed = cama ou box;',
  'table = mesa, escrivaninha ou bancada; frame = quadro, espelho de parede ou TV de parede;',
  'cabinet = rack, painel com rack, cômoda, aparador, buffet, criado-mudo, estante ou armário baixo.',
].join('\n')

export const KIND_SCHEMA = {
  anyOf: [{ type: 'string', enum: [...FURNITURE_KIND_VALUES] }, { type: 'null' }],
}

export function parseKind(value: unknown): DetectedKind | null {
  return FURNITURE_KIND_VALUES.includes(value as DetectedKind) ? (value as DetectedKind) : null
}

/**
 * Nome em inglês com que o SAM 3D recorta o móvel da foto do anúncio, deixando
 * a sala, a planta e o resto do fundo de fora.
 */
const SEGMENT_PROMPTS: Readonly<Record<DetectedKind, string>> = {
  stove: 'stove',
  sofa: 'sofa',
  fridge: 'refrigerator',
  wardrobe: 'wardrobe',
  bed: 'bed',
  table: 'table',
  cabinet: 'cabinet',
  frame: 'picture frame',
}
/** Sem tipo reconhecido (ou sem a conferência do Claude), o recorte procura qualquer móvel. */
const GENERIC_SEGMENT_PROMPT = 'furniture'

export function segmentPrompt(kind: DetectedKind | null): string {
  return kind ? SEGMENT_PROMPTS[kind] : GENERIC_SEGMENT_PROMPT
}
