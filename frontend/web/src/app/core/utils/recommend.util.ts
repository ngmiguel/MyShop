import { Product } from '../models';
import { OnboardingState } from '../services/onboarding.service';
import { DEMO_STORE_COORDS } from '../data/demo-stores';

export interface ScoredProduct {
  product: Product;
  score: number;
  distance: number;
  rating: number;
}

export function distanceKm(
  from: { lat: number; lng: number },
  storeId: string,
): number {
  const to = DEMO_STORE_COORDS[storeId];
  if (!to) return 20 + (storeId.charCodeAt(storeId.length - 1) % 15);
  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function productRating(product: Product): number {
  const base = 3.6 + (product.id.charCodeAt(0) % 14) / 10;
  return Math.round(base * 10) / 10;
}

export function scoreProducts(
  products: Product[],
  prefs: OnboardingState,
  favorites: string[],
): ScoredProduct[] {
  return products.map((product) => {
    const distance = distanceKm({ lat: prefs.lat, lng: prefs.lng }, product.storeId);
    const rating = productRating(product);
    let score = 0;

    if (prefs.categories.includes(product.categoryId ?? '')) score += 45;
    if (prefs.subcategories.includes(product.subcategoryId ?? '')) score += 25;
    if (distance <= prefs.radiusKm) score += 20;
    else score += Math.max(0, 12 - distance / 20);

    if (product.price >= prefs.budgetMin && product.price <= prefs.budgetMax) score += 18;
    else score -= 6;

    score += rating * 3;
    if (product.compareAtPrice) score += 6;
    if (product.stock === 0) score -= 25;
    if (favorites.includes(product.id)) score += 10;

    return { product, score, distance, rating };
  });
}

export function similarProducts(product: Product, products: Product[], limit = 6): Product[] {
  return products
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      s:
        (p.subcategoryId === product.subcategoryId ? 40 : 0) +
        (p.categoryId === product.categoryId ? 20 : 0) +
        (p.storeId === product.storeId ? 10 : 0) +
        Math.max(0, 15 - Math.abs(p.price - product.price) / (product.price || 1) * 15),
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}
