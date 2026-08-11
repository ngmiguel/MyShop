import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category, PaginatedResponse, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiService);

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
    return this.api.get<PaginatedResponse<Product>>('/catalog/products', params);
  }

  getProduct(id: string): Observable<Product> {
    return this.api.get<Product>(`/catalog/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>('/catalog/categories');
  }

  getCategory(id: string): Observable<Category> {
    return this.api.get<Category>(`/catalog/categories/${id}`);
  }
}
