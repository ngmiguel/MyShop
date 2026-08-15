import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { ApiService } from './api.service';
import { ManagerDataService } from './manager-data.service';
import { PaginatedResponse, Store } from '../models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly api = inject(ApiService);
  private readonly demo = inject(ManagerDataService);

  getStores(params?: { search?: string; city?: string; page?: number; limit?: number }): Observable<PaginatedResponse<Store>> {
    return this.api.get<PaginatedResponse<Store>>('/stores/stores', params).pipe(
      catchError(() => {
        let { data, total } = this.demo.getStoresPaginated();
        const q = params?.search?.trim().toLowerCase();
        if (q) {
          data = data.filter((s) => `${s.name} ${s.city}`.toLowerCase().includes(q));
          total = data.length;
        }
        if (params?.city) {
          data = data.filter((s) => s.city === params.city);
          total = data.length;
        }
        return of({ data, total, page: params?.page ?? 1, limit: params?.limit ?? data.length, totalPages: 1 });
      }),
    );
  }

  getStore(id: string): Observable<Store> {
    return this.api.get<Store>(`/stores/stores/${id}`).pipe(
      catchError(() => {
        const store = this.demo.getStore(id);
        if (!store) throw new Error('Store not found');
        return of(this.demo.toStoreView(store));
      }),
    );
  }

  validateAccessCode(code: string): Observable<Store> {
    return this.api.get<Store>(`/stores/stores/validate-code/${code}`).pipe(
      catchError(() => {
        const store = this.demo.getManagerStores().find(
          (s) => s.accessCode.toUpperCase() === code.trim().toUpperCase(),
        );
        if (!store) throw new Error('Invalid code');
        return of(this.demo.toStoreView(store));
      }),
    );
  }

  createStore(data: Partial<Store>): Observable<Store> {
    return this.api.post<Store>('/stores/stores', data).pipe(
      catchError(() => of({ id: `st-new-${Date.now()}`, name: data.name ?? 'Nouvelle boutique', isActive: true, ...data } as Store)),
    );
  }

  updateStore(id: string, data: Partial<Store>): Observable<Store> {
    return this.api.patch<Store>(`/stores/stores/${id}`, data).pipe(
      catchError(() => {
        const updated = this.demo.updateStore(id, {
          name: data.name,
          city: data.city,
          address: data.address,
          phone: data.phone,
          email: data.email,
          description: data.description,
          autoApproveSellers: data.isActive,
        });
        if (!updated) throw new Error('Store not found');
        return of(this.demo.toStoreView(updated));
      }),
    );
  }

  deleteStore(id: string): Observable<void> {
    return this.api.delete<void>(`/stores/stores/${id}`).pipe(catchError(() => of(undefined)));
  }

  regenerateAccessCode(id: string): Observable<Store> {
    return this.api.post<Store>(`/stores/stores/${id}/regenerate-access-code`, {}).pipe(
      catchError(() => {
        const code = this.demo.regenerateAccessCode(id);
        const store = this.demo.getStore(id);
        if (!store) throw new Error('Store not found');
        return of({ ...this.demo.toStoreView(store), accessCode: code });
      }),
    );
  }
}
