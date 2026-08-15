import { Injectable, inject } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { ManagerDataService } from './manager-data.service';
import { PaginatedResponse, Seller, SellerPerformance } from '../models';

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly api = inject(ApiService);
  private readonly demo = inject(ManagerDataService);

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    accessCode: string;
  }): Observable<Seller> {
    return this.api.post<Seller>('/sellers/sellers/register', data);
  }

  login(email: string, password: string) {
    return this.api.post<{ accessToken: string; refreshToken: string; seller: Seller }>(
      '/sellers/sellers/login',
      { email, password },
    );
  }

  getSellers(params?: { storeId?: string; status?: string }): Observable<PaginatedResponse<Seller>> {
    return this.api.get<PaginatedResponse<Seller>>('/sellers/sellers', params).pipe(
      catchError(() => {
        const { data, total } = this.demo.getSellersPaginated(params);
        return of({ data, total, page: 1, limit: total, totalPages: 1 });
      }),
    );
  }

  getSeller(id: string): Observable<Seller> {
    return this.api.get<Seller>(`/sellers/sellers/${id}`).pipe(
      catchError(() => {
        const seller = this.demo.getSellers().find((s) => s.id === id);
        if (!seller) throw new Error('Seller not found');
        return of(seller);
      }),
    );
  }

  getPerformance(id: string): Observable<SellerPerformance> {
    return this.api.get<SellerPerformance>(`/sellers/sellers/${id}/performance`).pipe(
      catchError(() => {
        const stats = this.demo.sellerStats(id);
        return of({
          sellerId: id,
          totalOrders: stats.salesCount,
          totalRevenue: stats.revenue,
          averageRating: 4.5,
          averagePickupMinutes: 4.2,
          ordersToday: Math.round(stats.salesCount / 30),
          revenueToday: Math.round(stats.revenue / 30),
        });
      }),
    );
  }

  approve(id: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/sellers/${id}/approve`, {}).pipe(
      catchError(() => {
        const seller = this.demo.updateSellerStatus(id, 'active');
        if (!seller) throw new Error('Seller not found');
        return of(seller);
      }),
    );
  }

  suspend(id: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/sellers/${id}/suspend`, {}).pipe(
      catchError(() => {
        const seller = this.demo.updateSellerStatus(id, 'suspended');
        if (!seller) throw new Error('Seller not found');
        return of(seller);
      }),
    );
  }

  activate(id: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/sellers/${id}/activate`, {}).pipe(
      catchError(() => {
        const seller = this.demo.updateSellerStatus(id, 'active');
        if (!seller) throw new Error('Seller not found');
        return of(seller);
      }),
    );
  }
}
