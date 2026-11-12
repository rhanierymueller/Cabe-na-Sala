import type { FurnitureKind } from '../types/furniture'

/** Uma faixa de largura de um tipo de móvel e a busca da loja que combina com ela. */
export interface AffiliateOffer {
  readonly kind: FurnitureKind
  /** Maior largura (cm) que ainda entra nesta faixa; null = daqui para cima. */
  readonly maxWidthCm: number | null
  /** Como a faixa aparece no botão: "Sofás de 3 lugares". */
  readonly label: string
  /** A busca na loja, sem código de afiliado: é o que o dono converte no painel. */
  readonly searchUrl: string
  /** O link de afiliado gerado no painel da loja; null enquanto não foi gerado. */
  readonly affiliateUrl: string | null
}

export type LinkedAffiliateOffer = AffiliateOffer & { readonly affiliateUrl: string }

/**
 * A oferta da faixa de largura do móvel. Faixa sem link de afiliado devolve
 * null: o botão só existe quando o clique rende alguma coisa.
 */
export function pickAffiliateOffer(
  offers: readonly AffiliateOffer[],
  kind: FurnitureKind,
  widthCm: number,
): LinkedAffiliateOffer | null {
  const inRange = offers.find(
    (offer) => offer.kind === kind && (offer.maxWidthCm === null || widthCm <= offer.maxWidthCm),
  )
  if (!inRange || inRange.affiliateUrl === null) return null
  return { ...inRange, affiliateUrl: inRange.affiliateUrl }
}
