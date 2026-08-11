import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models';

export interface UserPreferences {
  notifications: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface FavoriteProduct {
  productId: string;
  addedAt: string;
}

const FAVORITES_KEY = 'myshop_favorites';
const PREFS_KEY = 'myshop_preferences';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<User> {
    return this.api.get<User>('/auth/me');
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.api.patch<User>('/users/profile', data);
  }

  getFavorites(): FavoriteProduct[] {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as FavoriteProduct[];
    } catch {
      return [];
    }
  }

  toggleFavorite(productId: string): boolean {
    const favorites = this.getFavorites();
    const index = favorites.findIndex((f) => f.productId === productId);
    if (index >= 0) {
      favorites.splice(index, 1);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return false;
    }
    favorites.push({ productId, addedAt: new Date().toISOString() });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }

  isFavorite(productId: string): boolean {
    return this.getFavorites().some((f) => f.productId === productId);
  }

  getPreferences(): UserPreferences {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) {
      return { notifications: true, language: 'fr', theme: 'system' };
    }
    try {
      return JSON.parse(raw) as UserPreferences;
    } catch {
      return { notifications: true, language: 'fr', theme: 'system' };
    }
  }

  savePreferences(prefs: UserPreferences): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  getAnalyticsOverview(): Observable<Record<string, number>> {
    return this.api.get<Record<string, number>>('/analytics/overview').pipe(
      // Fallback when analytics service is unavailable
    );
  }

  getMonitoringStatus(): Observable<{ services: { name: string; status: string }[] }> {
    return this.api.get<{ services: { name: string; status: string }[] }>('/analytics/monitoring');
  }
}
