import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { ApiService } from './api.service';
import { CatalogImageService } from './catalog-image.service';
import { Category, PaginatedResponse, Product, Store } from '../models';
import { DEMO_PRODUCTS } from '../data/demo-catalog';
import { DEMO_STORES } from '../data/demo-stores';
import { CATEGORIES } from '../data/categories';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);
  private readonly images = inject(CatalogImageService);

  getProducts(params?: {
    storeId?: string;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }): Observable<PaginatedResponse<Product>> {
    return this.api.get<PaginatedResponse<Product>>('/catalog/products', params).pipe(
      map((res) => ({
        ...res,
        data: this.images.enrichProducts(res.data ?? []),
      })),
      catchError(() => of(this.filterDemoProducts(params))),
    );
  }

  getProduct(id: string): Observable<Product> {
    const demo = DEMO_PRODUCTS.find((p) => p.id === id);
    if (demo) return of(this.images.enrichProduct(demo));
    return this.api.get<Product>(`/catalog/products/${id}`).pipe(
      map((p) => this.images.enrichProduct(p)),
      catchError(() => {
        const fallback = DEMO_PRODUCTS.find((p) => p.id === id);
        if (fallback) return of(this.images.enrichProduct(fallback));
        throw new Error('Product not found');
      }),
    );
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/catalog/categories').pipe(
      catchError(() =>
        of(
          CATEGORIES.map((c) => ({
            id: c.id,
            name: c.label,
            slug: c.id,
          })),
        ),
      ),
    );
  }

  getStores(): Observable<Store[]> {
    return this.api.get<Store[]>('/catalog/stores').pipe(
      catchError(() => of(DEMO_STORES)),
    );
  }

  getCategory(id: string): Observable<Category> {
    const local = CATEGORIES.find((c) => c.id === id);
    if (local) {
      return of({ id: local.id, name: local.label, slug: local.id });
    }
    return this.api.get<Category>(`/catalog/categories/${id}`);
  }

  private filterDemoProducts(params?: {
    storeId?: string;
    categoryId?: string;
    search?: string;
    inStock?: boolean;
    limit?: number;
  }): PaginatedResponse<Product> {
    let list = [...DEMO_PRODUCTS];
    if (params?.storeId) list = list.filter((p) => p.storeId === params.storeId);
    if (params?.categoryId) list = list.filter((p) => p.categoryId === params.categoryId);
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (params?.inStock) list = list.filter((p) => p.stock > 0);
    const limit = params?.limit ?? list.length;
    return {
      data: this.images.enrichProducts(list.slice(0, limit)),
      total: list.length,
      page: 1,
      limit,
      totalPages: 1,
    };
  }
}
