import { describe, expect, test } from 'vitest'
import { AFFILIATE_OFFERS } from '../../constants/affiliateOffers'
import { FURNITURE_KINDS } from '../../components/furniture/catalog'
import type { AffiliateOffer } from '../affiliate'
import { pickAffiliateOffer } from '../affiliate'

const SOFA_OFFERS: readonly AffiliateOffer[] = [
  { kind: 'sofa', maxWidthCm: 160, label: 'Sofás de 2 lugares', searchUrl: 'https://shopee.com.br/search?keyword=a', affiliateUrl: 'https://s.shopee.com.br/small' },
  { kind: 'sofa', maxWidthCm: 240, label: 'Sofás de 3 lugares', searchUrl: 'https://shopee.com.br/search?keyword=b', affiliateUrl: 'https://s.shopee.com.br/medium' },
  { kind: 'sofa', maxWidthCm: null, label: 'Sofás grandes', searchUrl: 'https://shopee.com.br/search?keyword=c', affiliateUrl: null },
  { kind: 'fridge', maxWidthCm: null, label: 'Geladeiras', searchUrl: 'https://shopee.com.br/search?keyword=d', affiliateUrl: 'https://s.shopee.com.br/fridge' },
]

describe('pickAffiliateOffer', () => {
  test('picks the offer of the width range the furniture falls in', () => {
    expect(pickAffiliateOffer(SOFA_OFFERS, 'sofa', 150)?.label).toBe('Sofás de 2 lugares')
    expect(pickAffiliateOffer(SOFA_OFFERS, 'sofa', 210)?.label).toBe('Sofás de 3 lugares')
  })

  test('treats the upper limit of a range as still inside it', () => {
    expect(pickAffiliateOffer(SOFA_OFFERS, 'sofa', 160)?.label).toBe('Sofás de 2 lugares')
    expect(pickAffiliateOffer(SOFA_OFFERS, 'sofa', 160.5)?.label).toBe('Sofás de 3 lugares')
  })

  test('never mixes furniture kinds', () => {
    expect(pickAffiliateOffer(SOFA_OFFERS, 'fridge', 70)?.label).toBe('Geladeiras')
    expect(pickAffiliateOffer(SOFA_OFFERS, 'bed', 140)).toBeNull()
  })

  test('returns nothing when the range has no affiliate link yet, so the button stays hidden', () => {
    expect(pickAffiliateOffer(SOFA_OFFERS, 'sofa', 300)).toBeNull()
  })
})

describe('AFFILIATE_OFFERS', () => {
  // "Outro" é qualquer objeto: não há busca de loja que sirva para ele.
  const kindsWithOffers = FURNITURE_KINDS.filter((kind) => kind !== 'other')

  test('offers nothing for "other", so its buy button stays hidden', () => {
    expect(AFFILIATE_OFFERS.some((offer) => offer.kind === 'other')).toBe(false)
  })

  test.each(kindsWithOffers.map((kind) => [kind] as const))('%s has ranges in ascending order ending in an open one', (kind) => {
    const limits = AFFILIATE_OFFERS.filter((offer) => offer.kind === kind).map((offer) => offer.maxWidthCm)

    expect(limits.length).toBeGreaterThan(0)
    expect(limits.at(-1)).toBeNull()
    const closed = limits.slice(0, -1) as number[]
    expect(closed).toEqual([...closed].sort((a, b) => a - b))
    expect(closed.every((limit) => limit !== null)).toBe(true)
  })

  test('only sends people to Shopee, by https', () => {
    AFFILIATE_OFFERS.forEach((offer) => {
      expect(new URL(offer.searchUrl).hostname).toBe('shopee.com.br')
      if (offer.affiliateUrl !== null) {
        const { protocol, hostname } = new URL(offer.affiliateUrl)
        expect(protocol).toBe('https:')
        expect(hostname === 'shopee.com.br' || hostname.endsWith('.shopee.com.br')).toBe(true)
      }
    })
  })
})
