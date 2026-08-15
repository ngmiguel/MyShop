import { DEMO_STORES } from '../data/demo-stores';

export const PROMO_CODES: Record<string, number> = {
  BIENVENUE10: 10,
  BOUTIKA5: 5,
  RETRAIT15: 15,
};

export const DEFAULT_TAX_RATE = 19.25;
export const QR_EXPIRY_HOURS = 24;

export function getPromoRate(code?: string): number {
  if (!code) return 0;
  return PROMO_CODES[code.toUpperCase()] ?? 0;
}

export function promoDiscount(subtotal: number, promoRate: number): number {
  return Math.round(subtotal * promoRate / 100);
}

export function storeTaxRate(storeId: string): number {
  return DEFAULT_TAX_RATE;
}

export function groupTax(subtotal: number, storeId: string): number {
  return Math.round(subtotal * storeTaxRate(storeId) / 100);
}

export function storeById(storeId: string) {
  return DEMO_STORES.find((s) => s.id === storeId);
}

export interface StoreGroupLike {
  storeId: string;
  subtotal: number;
}

export function cartTaxTotal(groups: StoreGroupLike[]): number {
  return groups.reduce((acc, g) => acc + groupTax(g.subtotal, g.storeId), 0);
}

export function cartGrandTotal(subtotal: number, tax: number, discount: number): number {
  return subtotal + tax - discount;
}
