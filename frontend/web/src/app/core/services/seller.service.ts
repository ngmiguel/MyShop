import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PaginatedResponse, Seller, SellerPerformance } from '../models';

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly api = inject(ApiService);

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
    return this.api.get<PaginatedResponse<Seller>>('/sellers/sellers', params);
  }

  getSeller(id: string): Observable<Seller> {
    return this.api.get<Seller>(`/sellers/sellers/${id}`);
  }

  getPerformance(id: string): Observable<SellerPerformance> {
    return this.api.get<SellerPerformance>(`/sellers/sellers/${id}/performance`);
  }

  approve(id: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/sellers/${id}/approve`, {});
  }

  suspend(id: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/sellers/${id}/suspend`, {});
  }

  activate(id: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/sellers/${id}/activate`, {});
  }
}
