import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <mat-icon>storefront</mat-icon>
          <span>MyShop Manager</span>
        </div>
        <nav>
          <a routerLink="/manager/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon> Tableau de bord
          </a>
          <a routerLink="/manager/stores" routerLinkActive="active">
            <mat-icon>store</mat-icon> Boutiques
          </a>
          <a routerLink="/manager/sellers" routerLinkActive="active">
            <mat-icon>badge</mat-icon> Vendeurs
          </a>
          <a routerLink="/manager/analytics" routerLinkActive="active">
            <mat-icon>analytics</mat-icon> Analytique
          </a>
          <a routerLink="/manager/monitoring" routerLinkActive="active">
            <mat-icon>monitor_heart</mat-icon> Monitoring
          </a>
          <a routerLink="/manager/profit" routerLinkActive="active">
            <mat-icon>account_balance</mat-icon> Profits
          </a>
          <a routerLink="/manager/settings" routerLinkActive="active">
            <mat-icon>settings</mat-icon> Reglages
          </a>
        </nav>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
      <nav class="mobile-nav">
        <a routerLink="/manager/dashboard" routerLinkActive="active"><mat-icon>dashboard</mat-icon></a>
        <a routerLink="/manager/stores" routerLinkActive="active"><mat-icon>store</mat-icon></a>
        <a routerLink="/manager/sellers" routerLinkActive="active"><mat-icon>badge</mat-icon></a>
        <a routerLink="/manager/analytics" routerLinkActive="active"><mat-icon>analytics</mat-icon></a>
        <a routerLink="/manager/settings" routerLinkActive="active"><mat-icon>settings</mat-icon></a>
      </nav>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100dvh;
      display: flex;
      background: var(--bg);
    }
    .sidebar {
      width: 240px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 20px 12px;
      display: none;
    }
    @media (min-width: 768px) {
      .sidebar { display: block; }
      .mobile-nav { display: none !important; }
      .content { padding-bottom: 0 !important; }
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px 20px;
      font-weight: 700;
      font-size: 1rem;
      color: var(--manager-primary, #7c3aed);
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 2px;
    }
    nav a.active, nav a:hover {
      background: rgba(124, 58, 237, 0.08);
      color: var(--manager-primary, #7c3aed);
    }
    .content {
      flex: 1;
      padding-bottom: 64px;
      max-width: 1200px;
    }
    .mobile-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
      z-index: 100;
    }
    .mobile-nav a {
      color: var(--text-muted);
      padding: 4px 12px;
    }
    .mobile-nav a.active { color: var(--manager-primary, #7c3aed); }
  `],
})
export class ManagerLayoutComponent {}
