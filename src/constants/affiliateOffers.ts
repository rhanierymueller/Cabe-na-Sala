import type { FurnitureKind } from '../types/furniture'
import type { AffiliateOffer } from '../utils/affiliate'

/**
 * Buscas da Shopee por tipo de móvel e faixa de largura. Para ligar uma
 * faixa: abra a `searchUrl` dela, gere o link de afiliado no painel da Shopee
 * e cole no último argumento, no lugar de `null`. Sem link, o botão dessa
 * faixa não aparece no site.
 *
 * As faixas de cada tipo vão em ordem crescente de largura; a última é
 * sempre aberta (`null`).
 */
function offer(
  kind: FurnitureKind,
  maxWidthCm: number | null,
  label: string,
  keyword: string,
  affiliateUrl: string | null,
): AffiliateOffer {
  const searchUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(keyword)}`
  return { kind, maxWidthCm, label, searchUrl, affiliateUrl }
}

export const AFFILIATE_OFFERS: readonly AffiliateOffer[] = [
  offer('sofa', 160, 'sofás de 2 lugares', 'sofá 2 lugares', 'https://s.shopee.com.br/8AXc8hkjT8'),
  offer('sofa', 200, 'sofás de 3 lugares compactos', 'sofá 3 lugares 1,90m', 'https://s.shopee.com.br/80EBwOlMo7'),
  offer('sofa', 240, 'sofás de 3 lugares', 'sofá 3 lugares 2,10m', 'https://s.shopee.com.br/9AQ9KXgvRM'),
  offer('sofa', null, 'sofás de 4 lugares', 'sofá 4 lugares retrátil', 'https://s.shopee.com.br/906j8EhYmL'),

  offer('stove', 60, 'fogões de 4 bocas', 'fogão 4 bocas', 'https://s.shopee.com.br/8pnIvviC7K'),
  offer('stove', null, 'fogões de 5 bocas', 'fogão 5 bocas', 'https://s.shopee.com.br/1BuPkfUTQ'),

  offer('fridge', 60, 'geladeiras compactas', 'geladeira frost free 1 porta', 'https://s.shopee.com.br/BVKc3er8T'),
  offer('fridge', 72, 'geladeiras duplex', 'geladeira duplex frost free', 'https://s.shopee.com.br/LokoMeDnW'),
  offer('fridge', null, 'geladeiras grandes', 'geladeira french door', 'https://s.shopee.com.br/W8B0fdaSZ'),

  offer('wardrobe', 120, 'guarda-roupas de solteiro', 'guarda-roupa solteiro', 'https://s.shopee.com.br/gRbCycx7c'),
  offer('wardrobe', 180, 'guarda-roupas de casal', 'guarda-roupa casal 4 portas', 'https://s.shopee.com.br/906j8Ljc6c'),
  offer('wardrobe', 240, 'guarda-roupas de 6 portas', 'guarda-roupa casal 6 portas', 'https://s.shopee.com.br/9AQ9Keiylf'),
  offer('wardrobe', null, 'guarda-roupas grandes', 'guarda-roupa casal 8 portas', 'https://s.shopee.com.br/80EBwVnQ8S'),

  offer('bed', 100, 'camas de solteiro', 'cama box solteiro', 'https://s.shopee.com.br/8AXc8ommnV'),
  offer('bed', 145, 'camas de casal', 'cama box casal', 'https://s.shopee.com.br/8Kr2L7m9SY'),
  offer('bed', 165, 'camas queen', 'cama box queen', 'https://s.shopee.com.br/9zzGKFI7iX'),
  offer('bed', null, 'camas king', 'cama box king', 'https://s.shopee.com.br/AUvWvAGDhe'),

  offer('table', 100, 'mesas de 4 lugares', 'mesa de jantar 4 lugares', 'https://s.shopee.com.br/AKc6irGr2d'),
  offer('table', 160, 'mesas de 6 lugares', 'mesa de jantar 6 lugares', 'https://s.shopee.com.br/8AXc8sP6RE'),
  offer('table', null, 'mesas de 8 lugares', 'mesa de jantar 8 lugares', 'https://s.shopee.com.br/80EBwZPjmD'),

  offer('cabinet', 140, 'racks compactos', 'rack para tv 1,20m', 'https://s.shopee.com.br/70LekhqQ41'),
  offer('cabinet', 190, 'racks médios', 'rack para tv 1,80m', 'https://s.shopee.com.br/6q2EYOr3P0'),
  offer('cabinet', null, 'racks grandes', 'rack para tv 2,20m', 'https://s.shopee.com.br/6fioM5rgjz'),

  offer('frame', 60, 'quadros pequenos', 'quadro decorativo 40x60', 'https://s.shopee.com.br/7pulkEnFNE'),
  offer('frame', 100, 'quadros médios', 'quadro decorativo 60x90', 'https://s.shopee.com.br/7fbLXvnsiD'),
  offer('frame', null, 'quadros grandes', 'quadro decorativo grande 120cm', 'https://s.shopee.com.br/9pfq7x9UCq'),
]
