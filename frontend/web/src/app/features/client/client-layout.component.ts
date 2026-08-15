import { Component, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../../core/services/auth.service';

import { CartStateService } from '../../core/services/cart-state.service';

import { OnboardingService } from '../../core/services/onboarding.service';

import { ThemeQuickToggleComponent } from '../../shared/components/theme-quick-toggle/theme-quick-toggle.component';

import { OnboardingComponent } from '../onboarding/onboarding.component';



@Component({

  selector: 'app-client-layout',

  standalone: true,

  imports: [

    RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, FormsModule,

    ThemeQuickToggleComponent, OnboardingComponent,

  ],

  template: `

    @if (!onboarding.state().completed) {

      <app-onboarding />

    } @else {

      <div class="layout">

        <header class="header">

          <div class="header-inner">

            <a routerLink="/client/feed" class="brand">

              <span class="brand-mark">B</span>

              <span class="brand-name">Boutika</span>

            </a>



            <form class="search" (submit)="submitSearch($event)">

              <mat-icon class="search-icon">search</mat-icon>

              <input [(ngModel)]="query" name="q" placeholder="Rechercher un article, une boutique, une ville…" aria-label="Rechercher" />

            </form>



            <app-theme-quick-toggle />



            <a routerLink="/client/cart" class="icon-btn" [attr.aria-label]="'Panier, ' + cartState.count() + ' articles'">

              <mat-icon>shopping_bag</mat-icon>

              @if (cartState.count() > 0) {

                <span class="badge">{{ cartState.count() }}</span>

              }

            </a>



            <a routerLink="/client/account" class="icon-btn desktop-only" aria-label="Mon compte">

              <mat-icon>person</mat-icon>

            </a>



            <a [routerLink]="roleLink()" class="btn-primary role-cta">

              <mat-icon>login</mat-icon>

              <span class="role-label-desktop">{{ roleLabel() }}</span>

              <span class="role-label-mobile">{{ roleLabelShort() }}</span>

            </a>

          </div>



          <nav class="desktop-nav" aria-label="Navigation principale">

            @for (item of nav; track item.to) {

              <a [routerLink]="item.to" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">

                <mat-icon>{{ item.icon }}</mat-icon>

                {{ item.label }}

              </a>

            }

            @if (auth.user()?.email) {

              <span class="connected">Connecté · {{ auth.user()!.email }}</span>

            }

          </nav>

        </header>



        <main class="content">

          <router-outlet />

        </main>



        <nav class="mobile-nav" aria-label="Navigation mobile">

          @for (item of nav; track item.to) {

            <a [routerLink]="item.to" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact }">

              <mat-icon>{{ item.icon }}</mat-icon>

              <span>{{ item.label }}</span>

            </a>

          }

        </nav>

      </div>

    }

  `,

  styles: [`

    .layout {

      min-height: 100dvh;

      display: flex;

      flex-direction: column;

      background: rgb(var(--canvas));

    }

    .header {

      position: sticky;

      top: 0;

      z-index: 30;

      border-bottom: 1px solid rgb(var(--line));

      background: rgba(var(--surface), 0.95);

      backdrop-filter: blur(8px);

    }

    .header-inner {

      max-width: 80rem;

      margin: 0 auto;

      display: flex;

      align-items: center;

      gap: 12px;

      padding: 12px 16px;

    }

    .brand {

      display: flex;

      align-items: center;

      gap: 8px;

      color: rgb(var(--ink));

      text-decoration: none;

    }

    .brand-mark {

      width: 32px;

      height: 32px;

      border-radius: 8px;

      background: rgb(var(--accent));

      color: white;

      display: flex;

      align-items: center;

      justify-content: center;

      font-weight: 700;

      font-size: 14px;

    }

    .brand-name {

      font-weight: 600;

      letter-spacing: -0.02em;

      display: none;

    }

    @media (min-width: 640px) { .brand-name { display: inline; } }



    .search {

      position: relative;

      flex: 1;

      margin-left: 8px;

    }

    .search-icon {

      position: absolute;

      left: 12px;

      top: 50%;

      transform: translateY(-50%);

      color: rgb(var(--muted));

      font-size: 16px;

      width: 16px;

      height: 16px;

      pointer-events: none;

    }

    .search input {

      width: 100%;

      border-radius: 999px;

      border: 1px solid rgb(var(--line));

      background: rgb(var(--surface-2));

      padding: 8px 16px 8px 36px;

      font-size: 14px;

      color: rgb(var(--ink));

    }

    .search input::placeholder { color: rgb(var(--muted)); }

    .search input:focus {

      outline: none;

      border-color: rgb(var(--accent));

      box-shadow: 0 0 0 3px rgba(var(--accent), 0.15);

    }



    .icon-btn {

      position: relative;

      display: inline-flex;

      padding: 8px;

      border-radius: 8px;

      color: rgb(var(--muted));

      text-decoration: none;

    }

    .icon-btn:hover { background: rgb(var(--surface-2)); color: rgb(var(--ink)); }

    .badge {

      position: absolute;

      right: -2px;

      top: -2px;

      min-width: 16px;

      height: 16px;

      border-radius: 999px;

      background: rgb(var(--accent));

      color: white;

      font-size: 10px;

      font-weight: 600;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 0 4px;

    }

    .role-cta { border-radius: 999px; padding: 8px 12px; font-size: 12px; gap: 6px; }

    @media (min-width: 640px) { .role-cta { padding: 8px 16px; font-size: 14px; } }

    .role-cta mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .role-label-desktop { display: none; }

    .role-label-mobile { display: inline; }

    @media (min-width: 640px) {

      .role-label-desktop { display: inline; }

      .role-label-mobile { display: none; }

    }



    .desktop-nav {

      display: none;

      max-width: 80rem;

      margin: 0 auto;

      gap: 4px;

      padding: 0 16px 8px;

      align-items: center;

    }

    @media (min-width: 640px) { .desktop-nav { display: flex; } }

    .desktop-nav a {

      display: inline-flex;

      align-items: center;

      gap: 6px;

      padding: 6px 12px;

      border-radius: 999px;

      font-size: 14px;

      font-weight: 500;

      color: rgb(var(--muted));

      text-decoration: none;

      background: rgb(var(--surface-2));

      border: 1px solid transparent;

      transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;

    }

    .desktop-nav a:hover {

      color: rgb(var(--ink));

      border-color: rgb(var(--line));

    }

    .desktop-nav a.active {

      background: rgba(var(--accent), 0.14);

      color: rgb(var(--accent));

      font-weight: 600;

      box-shadow: inset 0 -2px 0 rgb(var(--accent));

    }

    .desktop-nav mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .connected {

      margin-left: auto;

      font-size: 12px;

      color: rgb(var(--muted));

    }



    .content {

      flex: 1;

      max-width: 80rem;

      width: 100%;

      margin: 0 auto;

      padding: 24px 16px 96px;

    }

    @media (min-width: 640px) { .content { padding-bottom: 40px; } }



    .mobile-nav {

      position: fixed;

      bottom: 0;

      left: 0;

      right: 0;

      z-index: 30;

      display: grid;

      grid-template-columns: repeat(5, 1fr);

      border-top: 1px solid rgb(var(--line));

      background: rgb(var(--surface));

    }

    @media (min-width: 640px) { .mobile-nav { display: none; } }

    .mobile-nav a {

      display: flex;

      flex-direction: column;

      align-items: center;

      gap: 2px;

      margin: 4px 2px;

      padding: 6px 4px;

      border-radius: 10px;

      font-size: 10px;

      font-weight: 500;

      color: rgb(var(--muted));

      text-decoration: none;

      background: rgb(var(--surface-2));

      transition: background 0.15s, color 0.15s;

    }

    .mobile-nav a.active {

      background: rgba(var(--accent), 0.14);

      color: rgb(var(--accent));

      font-weight: 600;

    }

    .mobile-nav mat-icon { font-size: 20px; width: 20px; height: 20px; }



    .desktop-only { display: none; }

    @media (min-width: 640px) { .desktop-only { display: inline-flex; } }

  `],

})

export class ClientLayoutComponent implements OnInit {

  readonly auth = inject(AuthService);

  readonly cartState = inject(CartStateService);

  readonly onboarding = inject(OnboardingService);

  private readonly router = inject(Router);



  query = '';



  nav = [

    { to: '/client/feed', label: 'Découvrir', icon: 'storefront', exact: true },

    { to: '/client/codes', label: 'Mes codes', icon: 'qr_code_2', exact: false },

    { to: '/client/favorites', label: 'Favoris', icon: 'favorite', exact: false },

    { to: '/client/profit', label: 'Dépenses', icon: 'pie_chart', exact: false },

    { to: '/client/settings', label: 'Paramètres', icon: 'settings', exact: false },

  ];



  ngOnInit(): void {

    this.cartState.refresh();

  }



  submitSearch(e: Event): void {

    e.preventDefault();

    this.router.navigate(['/client/feed'], { queryParams: { q: this.query } });

  }



  roleLabel(): string {

    const role = this.auth.user()?.role;

    if (role === 'vendeur') return 'Espace vendeur';

    if (role === 'manager') return 'Espace manager';

    return 'Se connecter';

  }



  roleLabelShort(): string {

    const role = this.auth.user()?.role;

    if (role === 'client' || !role) return 'Connexion';

    return 'Espace';

  }



  roleLink(): string {

    const role = this.auth.user()?.role;

    if (role === 'vendeur') return '/seller/scanner';

    if (role === 'manager') return '/manager/dashboard';

    return '/auth/login';

  }

}


