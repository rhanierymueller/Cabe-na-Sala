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
