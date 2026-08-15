import { Injectable, inject, signal, computed } from '@angular/core';

import { Router } from '@angular/router';

import { Observable, of, tap, catchError } from 'rxjs';

import { ApiService } from './api.service';

import { AuthResponse, User, UserRole } from '../models';

import { DemoAccount } from '../data/demo-accounts';



const TOKEN_KEY = 'myshop_access_token';

const REFRESH_KEY = 'myshop_refresh_token';

const USER_KEY = 'myshop_user';

const DEMO_MODE_KEY = 'boutika_demo_mode';

export const DEMO_TOKEN = 'demo.local.token';



const DEMO_USERS: Record<string, User> = {

  'manager@myshop.app': {

    id: 'demo-manager-1',

    email: 'manager@myshop.app',

    role: 'manager',

    firstName: 'Manager',

    lastName: 'Boutika',

  },

  'kofi.vendeur@myshop.app': {

    id: 'demo-seller-1',

    email: 'kofi.vendeur@myshop.app',

    role: 'vendeur',

    firstName: 'Kofi',

    lastName: 'Mensah',

    storeId: 'demo-store-1',

  },

  'aicha.vendeur@myshop.app': {

    id: 'demo-seller-2',

    email: 'aicha.vendeur@myshop.app',

    role: 'vendeur',

    firstName: 'Aïcha',

    lastName: 'Traoré',

    storeId: 'demo-store-2',

  },

};



@Injectable({ providedIn: 'root' })

export class AuthService {

  private readonly api = inject(ApiService);

  private readonly router = inject(Router);



  private readonly userSignal = signal<User | null>(this.loadUser());



  readonly user = this.userSignal.asReadonly();

  readonly isAuthenticated = computed(() => !!this.userSignal());

  readonly role = computed(() => this.userSignal()?.role ?? null);

  readonly isDemoMode = computed(() => localStorage.getItem(DEMO_MODE_KEY) === '1');



  get accessToken(): string | null {

    return localStorage.getItem(TOKEN_KEY);

  }



  /** Connexion locale sans backend — pour la démo / prototype. */

  loginDemo(account: DemoAccount): void {

    if (account.role === 'client') {

      this.router.navigate(['/client/feed']);

      return;

    }

    const email = account.email ?? `${account.role}@demo.local`;

    const user = DEMO_USERS[email] ?? {

      id: `demo-${account.role}`,

      email,

      role: account.role,

      firstName: account.label.split(' ')[0],

      lastName: account.label.split(' ').slice(1).join(' ') || 'Demo',

      storeId: account.role === 'vendeur' ? 'demo-store-1' : undefined,

    };

    this.persistAuth({

      accessToken: DEMO_TOKEN,

      refreshToken: 'demo.local.refresh',

      user,

    }, true);

    this.redirectByRole(user.role);

  }



  login(email: string, password: string) {

    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(

      tap((res) => this.persistAuth(res, false)),

    );

  }



  loginSeller(email: string, password: string) {

    return this.api.post<AuthResponse & { seller?: unknown }>('/sellers/sellers/login', { email, password }).pipe(

      tap((res) => this.persistAuth(res, false)),

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

      tap((res) => this.persistAuth(res, false)),

    );

  }



  refreshToken(): Observable<AuthResponse | null> {

    if (this.isDemoMode()) return of(null);

    const refreshToken = localStorage.getItem(REFRESH_KEY);

    if (!refreshToken) return of(null);

    return this.api.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(

      tap((res) => this.persistAuth(res, false)),

      catchError(() => {

        this.logout();

        return of(null);

      }),

    );

  }



  fetchMe() {

    if (this.isDemoMode()) {

      const user = this.userSignal();

      return user ? of(user) : of(null as unknown as User);

    }

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

    localStorage.removeItem(DEMO_MODE_KEY);

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



  private persistAuth(res: AuthResponse, demo: boolean): void {

    localStorage.setItem(TOKEN_KEY, res.accessToken);

    localStorage.setItem(REFRESH_KEY, res.refreshToken);

    localStorage.setItem(USER_KEY, JSON.stringify(res.user));

    if (demo) {

      localStorage.setItem(DEMO_MODE_KEY, '1');

    } else {

      localStorage.removeItem(DEMO_MODE_KEY);

    }

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


