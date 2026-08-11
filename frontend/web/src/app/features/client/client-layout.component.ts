import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="layout">
      <main class="content">
        <router-outlet />
      </main>
      <nav class="bottom-nav">
        <a routerLink="/client/feed" routerLinkActive="active">
          <mat-icon>home</mat-icon>
          <span>Accueil</span>
        </a>
        <a routerLink="/client/codes" routerLinkActive="active">
          <mat-icon>qr_code_2</mat-icon>
          <span>Codes</span>
        </a>
        <a routerLink="/client/cart" routerLinkActive="active">
          <mat-icon>shopping_cart</mat-icon>
          <span>Panier</span>
        </a>
        <a routerLink="/client/favorites" routerLinkActive="active">
          <mat-icon>favorite</mat-icon>
          <span>Favoris</span>
        </a>
        <a routerLink="/client/settings" routerLinkActive="active">
          <mat-icon>person</mat-icon>
          <span>Profil</span>
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
      padding: 6px 12px;
      text-decoration: none;
      color: var(--text-muted);
      font-size: 0.625rem;
      border-radius: 8px;
      transition: color 0.2s;
    }
    .bottom-nav a.active { color: var(--primary); }
    .bottom-nav mat-icon { font-size: 22px; width: 22px; height: 22px; }
  `],
})
export class ClientLayoutComponent {}
