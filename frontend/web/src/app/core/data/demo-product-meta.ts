import { Product } from '../models';
import { CATEGORIES, categoryLabel } from './categories';

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductMeta {
  rating: number;
  reviewCount: number;
  views: number;
  createdAt: string;
  specs: Record<string, string>;
  reviews: ProductReview[];
}

const REVIEW_COMMENTS = [
  'Très bon rapport qualité-prix, retrait rapide en boutique.',
  'Article conforme à la description, vendeur accueillant.',
  'Livraison en retrait impeccable, je recommande.',
  'Produit solide, emballage soigné.',
  'Parfait pour un usage quotidien.',
];

const REVIEW_AUTHORS = ['Marie K.', 'Jean-Paul M.', 'Aïcha T.', 'Samuel N.', 'Grace E.'];

function hash(id: string): number {
  return id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function getProductMeta(product: Product): ProductMeta {
  const h = hash(product.id);
  const rating = Math.round((3.5 + (h % 15) / 10) * 10) / 10;
  const reviewCount = 8 + (h % 120);
  const views = 120 + (h % 2400);
  const daysAgo = 5 + (h % 180);
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

  const cat = CATEGORIES.find((c) => c.id === product.categoryId);
  const sub = cat?.subcategories.find((s) => s.id === product.subcategoryId);

  const specs: Record<string, string> = {
    Catégorie: cat?.label ?? product.categoryId ?? '—',
    'Sous-catégorie': sub?.label ?? '—',
    Devise: product.currency,
    Disponibilité: product.stock > 0 ? `${product.stock} unité(s)` : 'Rupture',
    Boutique: product.storeName ?? product.storeId,
  };
  if (product.tags?.length) specs['Tags'] = product.tags.join(', ');

  const reviewLen = 2 + (h % 3);
  const reviews: ProductReview[] = Array.from({ length: reviewLen }, (_, i) => ({
    id: `rev-${product.id}-${i}`,
    author: REVIEW_AUTHORS[(h + i) % REVIEW_AUTHORS.length],
    rating: Math.min(5, Math.max(3, rating - 0.5 + (i % 2))),
    comment: REVIEW_COMMENTS[(h + i) % REVIEW_COMMENTS.length],
    date: new Date(Date.now() - (i + 1) * 7 * 86400000).toISOString(),
  }));

  return { rating, reviewCount, views, createdAt, specs, reviews };
}

export function formatDetailDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function storeHoursToday(): { open: string; close: string; closed: boolean } {
  const day = new Date().getDay();
  if (day === 0) return { open: '', close: '', closed: true };
  return { open: '08:00', close: '18:30', closed: false };
}

export function storeRating(storeId: string): { rating: number; reviewCount: number } {
  const h = hash(storeId);
  return { rating: Math.round((4 + (h % 10) / 10) * 10) / 10, reviewCount: 50 + (h % 400) };
}
