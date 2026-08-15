import { Product } from '../models';
import { productGallery, productImage } from './images';
import { buildProductsFromSeeds } from './demo-product-seeds';

function enrich(p: Product): Product {
  return {
    ...p,
    imageUrl: productImage(p.id, p.categoryId),
    gallery: productGallery(p.id, p.categoryId, undefined, 4),
  };
}

/** Catalogue local affiché quand l'API est indisponible (mode démo / offline). */
export const DEMO_PRODUCTS: Product[] = buildProductsFromSeeds(enrich);
