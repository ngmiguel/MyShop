import { Injectable } from '@angular/core';
import { Product, Store } from '../models';
import {
  categoryImage,
  productGallery,
  productImage,
  storeCoverImage,
  storeLogoImage,
} from '../data/images';

@Injectable({ providedIn: 'root' })
export class CatalogImageService {
  /** Toujours résoudre via Unsplash — ignore les URLs API (souvent Picsum / cassées). */
  productImageUrl(product: Pick<Product, 'id' | 'imageUrl' | 'categoryId'> & { categoryName?: string }): string {
    return productImage(product.id, product.categoryId, product.categoryName);
  }

  productGallery(product: Pick<Product, 'id' | 'categoryId' | 'gallery'> & { categoryName?: string; imageUrl?: string }): string[] {
    return productGallery(product.id, product.categoryId, product.categoryName);
  }

  enrichProduct<T extends Product>(product: T): T {
    const imageUrl = this.productImageUrl(product);
    return {
      ...product,
      imageUrl,
      gallery: this.productGallery(product),
    };
  }

  enrichProducts<T extends Product>(products: T[]): T[] {
    return products.map((p) => this.enrichProduct(p));
  }

  enrichStore<T extends Store>(store: T): T {
    return {
      ...store,
      coverUrl: storeCoverImage(store.id),
      logoUrl: storeLogoImage(store.id),
    };
  }

  categoryImageUrl(categoryId: string, categoryName?: string): string {
    return categoryImage(categoryId, categoryName);
  }
}
