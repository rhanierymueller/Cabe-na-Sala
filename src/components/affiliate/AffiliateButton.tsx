import { ShoppingBag } from 'lucide-react'
import { AFFILIATE_OFFERS } from '../../constants/affiliateOffers'
import { trackEvent } from '../../services/analytics'
import type { DimensionsCm, FurnitureKind } from '../../types/furniture'
import { pickAffiliateOffer } from '../../utils/affiliate'

interface AffiliateButtonProps {
  readonly kind: FurnitureKind
  readonly dimensionsCm: DimensionsCm
}

/**
 * O botão de compra, logo abaixo das medidas: abre na Shopee a busca do tipo e da faixa de largura
 * do móvel na tela, com o link de afiliado do site. Não aparece enquanto a
 * faixa não tiver link.
 */
export function AffiliateButton({ kind, dimensionsCm }: AffiliateButtonProps) {
  const offer = pickAffiliateOffer(AFFILIATE_OFFERS, kind, dimensionsCm.widthCm)
  if (!offer) return null

  return (
    <div className="panel-section affiliate">
      <a
        className="button button--primary button--block affiliate__button"
        href={offer.affiliateUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackEvent('affiliate_click', { furniture: kind, store: 'shopee', range: offer.label })}
      >
        <ShoppingBag size={20} aria-hidden="true" />
        <span className="affiliate__text">
          <strong>Ver preços na Shopee</strong>
          <span className="affiliate__range">{offer.label}</span>
        </span>
      </a>
    </div>
  )
}
