import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse, Store } from '../models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly api = inject(ApiService);

  getStores(params?: { search?: string; city?: string; page?: number; limit?: number }): Observable<PaginatedResponse<Store>> {
    return this.api.get<PaginatedResponse<Store>>('/stores/stores', params);
  }

  getStore(id: string): Observable<Store> {
    return this.api.get<Store>(`/stores/stores/${id}`);
  }

  validateAccessCode(code: string): Observable<Store> {
    return this.api.get<Store>(`/stores/stores/validate-code/${code}`);
  }

  createStore(data: Partial<Store>): Observable<Store> {
    return this.api.post<Store>('/stores/stores', data);
  }

  updateStore(id: string, data: Partial<Store>): Observable<Store> {
    return this.api.patch<Store>(`/stores/stores/${id}`, data);
  }

  deleteStore(id: string): Observable<void> {
    return this.api.delete<void>(`/stores/stores/${id}`);
  }

  regenerateAccessCode(id: string): Observable<Store> {
    return this.api.post<Store>(`/stores/stores/${id}/regenerate-access-code`, {});
  }
}
