import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="layout">
      <main class="content">
        <router-outlet />
      </main>
      <nav class="bottom-nav">
        <a routerLink="/seller/scanner" routerLinkActive="active">
          <mat-icon>qr_code_scanner</mat-icon>
          <span>Scanner</span>
        </a>
        <a routerLink="/seller/queue" routerLinkActive="active">
          <mat-icon>list_alt</mat-icon>
          <span>File</span>
        </a>
        <a routerLink="/seller/performance" routerLinkActive="active">
          <mat-icon>trending_up</mat-icon>
          <span>Perf.</span>
        </a>
        <a routerLink="/seller/profit" routerLinkActive="active">
          <mat-icon>payments</mat-icon>
          <span>Revenus</span>
        </a>
        <a routerLink="/seller/settings" routerLinkActive="active">
          <mat-icon>settings</mat-icon>
          <span>Reglages</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      max-width: 480px;
      margin: 0 auto;
      background: var(--bg);
    }
    .content { flex: 1; padding-bottom: 72px; }
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 480px;
      display: flex;
      justify-content: space-around;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding: 6px 0 calc(6px + env(safe-area-inset-bottom));
      z-index: 100;
    }
    .bottom-nav a {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 8px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 0.625rem;
    }
    .bottom-nav a.active { color: var(--seller-primary, #059669); }
    .bottom-nav mat-icon { font-size: 22px; width: 22px; height: 22px; }
  `],
})
export class SellerLayoutComponent {}
