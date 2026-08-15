/** Images publiques Unsplash — URLs stables, compatibles hotlink avec referrer no-referrer. */

import { PRODUCT_IMAGE_POOL } from './product-images.pool';

export const CATEGORY_IMAGES: Record<string, string> = {
  agro: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
  animaux: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80&auto=format&fit=crop',
  vehicules: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop',
  materiaux: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop',
  tech: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
  bijoux: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80&auto=format&fit=crop',
  style: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&auto=format&fit=crop',
  maison: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',
  beaute: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80&auto=format&fit=crop',
  sport: 'https://images.unsplash.com/photo-1517649763962-0c62306601b7?w=800&q=80&auto=format&fit=crop',
  livres: 'https://images.unsplash.com/photo-1495446815901-a72907e633e8?w=800&q=80&auto=format&fit=crop',
  jouets: 'https://images.unsplash.com/photo-1558062567-647105793c8f?w=800&q=80&auto=format&fit=crop',
  art: 'https://images.unsplash.com/photo-1460661419201-fd4ceffd8dfa?w=800&q=80&auto=format&fit=crop',
  energie: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop',
  agriculture: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80&auto=format&fit=crop',
  services: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80&auto=format&fit=crop',
  // Alias catégories API backend
  electronique: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
  mode: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&auto=format&fit=crop',
  alimentation: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
  auto: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop',
};

export const STOREFRONT_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop';

export const STORE_INTERIOR_IMAGE =
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80&auto=format&fit=crop';

const CATEGORY_KEYS = Object.keys(CATEGORY_IMAGES);

function hashId(id: string): number {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Mappe un libellé ou slug API vers une clé image connue. */
export function resolveCategoryImageKey(categoryId?: string, categoryName?: string): string {
  if (categoryId && CATEGORY_IMAGES[categoryId]) return categoryId;
  const needle = `${categoryId ?? ''} ${categoryName ?? ''}`.toLowerCase();
  if (needle.includes('électron') || needle.includes('electron') || needle.includes('tech')) return 'tech';
  if (needle.includes('mode') || needle.includes('style') || needle.includes('vetement')) return 'style';
  if (needle.includes('maison') || needle.includes('mobilier')) return 'maison';
  if (needle.includes('beaut') || needle.includes('spa')) return 'beaute';
  if (needle.includes('aliment') || needle.includes('agro') || needle.includes('restaurant')) return 'agro';
  if (needle.includes('sport') || needle.includes('fitness')) return 'sport';
  if (needle.includes('jouet') || needle.includes('toy')) return 'jouets';
  if (needle.includes('auto') || needle.includes('vehic')) return 'vehicules';
  if (needle.includes('livre') || needle.includes('book')) return 'livres';
  if (needle.includes('service')) return 'services';
  return CATEGORY_KEYS[hashId(needle || 'default') % CATEGORY_KEYS.length];
}

export function categoryImage(categoryId: string, categoryName?: string): string {
  return CATEGORY_IMAGES[resolveCategoryImageKey(categoryId, categoryName)] ?? STOREFRONT_IMAGE;
}

export function productImage(productId: string, categoryId?: string, categoryName?: string): string {
  const key = resolveCategoryImageKey(categoryId, categoryName);
  const pool = PRODUCT_IMAGE_POOL[key];
  if (pool?.length) return pool[hashId(productId) % pool.length];
  return categoryImage(categoryId ?? productId, categoryName);
}

export function productGallery(productId: string, categoryId?: string, categoryName?: string, count = 4): string[] {
  const key = resolveCategoryImageKey(categoryId, categoryName);
  const pool = PRODUCT_IMAGE_POOL[key] ?? [categoryImage(key, categoryName)];
  const start = hashId(productId) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

export function storeCoverImage(storeId: string): string {
  const key = CATEGORY_KEYS[hashId(storeId) % CATEGORY_KEYS.length];
  return CATEGORY_IMAGES[key];
}

export function storeLogoImage(storeId: string): string {
  return STOREFRONT_IMAGE;
}

export type ProductAspect = 'tall' | 'square' | 'wide';

export function productAspect(productId: string): ProductAspect {
  return (['tall', 'square', 'wide'] as const)[hashId(productId) % 3];
}

export const ASPECT_HEIGHT: Record<ProductAspect, string> = {
  tall: '288px',
  square: '224px',
  wide: '176px',
};
