import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User, UserRole } from '../models';

const TOKEN_KEY = 'myshop_access_token';
const REFRESH_KEY = 'myshop_refresh_token';
const USER_KEY = 'myshop_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly userSignal = signal<User | null>(this.loadUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly role = computed(() => this.userSignal()?.role ?? null);

  get accessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  login(email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap((res) => this.persistAuth(res)),
    );
  }

  loginSeller(email: string, password: string) {
    return this.api.post<AuthResponse>('/sellers/sellers/login', { email, password }).pipe(
      tap((res) => this.persistAuth(res)),
    );
  }

  register(data: {
    email: string;
    password: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
    phone?: string;
    storeId?: string;
  }) {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap((res) => this.persistAuth(res)),
    );
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return of(null);
    return this.api.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(
      tap((res) => this.persistAuth(res)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  fetchMe() {
    return this.api.get<User>('/auth/me').pipe(
      tap((user) => {
        this.userSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  redirectByRole(role: UserRole): void {
    const routes: Record<UserRole, string> = {
      client: '/client/feed',
      vendeur: '/seller/scanner',
      manager: '/manager/dashboard',
    };
    this.router.navigate([routes[role]]);
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.role();
    return !!current && roles.includes(current);
  }

  private persistAuth(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSignal.set(res.user);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
