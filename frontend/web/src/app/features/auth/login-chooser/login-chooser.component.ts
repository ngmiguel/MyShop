import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-chooser',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="auth-page">
      <div class="auth-header">
        <mat-icon class="logo">storefront</mat-icon>
        <h1>MyShop</h1>
        <p>Choisissez votre espace de connexion</p>
      </div>

      <div class="role-cards">
        <a routerLink="/client/feed" class="role-card client">
          <mat-icon>shopping_bag</mat-icon>
          <div>
            <strong>Client</strong>
            <span>Parcourir et acheter</span>
          </div>
          <mat-icon class="arrow">chevron_right</mat-icon>
        </a>

        <a routerLink="/auth/seller" class="role-card seller">
          <mat-icon>badge</mat-icon>
          <div>
            <strong>Vendeur</strong>
            <span>Scanner et valider les commandes</span>
          </div>
          <mat-icon class="arrow">chevron_right</mat-icon>
        </a>

        <a routerLink="/auth/manager" class="role-card manager">
          <mat-icon>admin_panel_settings</mat-icon>
          <div>
            <strong>Manager</strong>
            <span>Administrer la marketplace</span>
          </div>
          <mat-icon class="arrow">chevron_right</mat-icon>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 32px 24px;
      max-width: 420px;
      margin: 0 auto;
    }
    .auth-header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 56px; width: 56px; height: 56px; color: var(--primary); }
    h1 { margin: 12px 0 4px; font-size: 1.75rem; }
    p { margin: 0; color: var(--text-muted); font-size: 0.9375rem; }
    .role-cards { display: flex; flex-direction: column; gap: 12px; }
    .role-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .role-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .role-card.client:hover { border-color: var(--primary); }
    .role-card.seller:hover { border-color: #059669; }
    .role-card.manager:hover { border-color: #7c3aed; }
    .role-card mat-icon:first-child { font-size: 28px; width: 28px; height: 28px; }
    .role-card.client mat-icon:first-child { color: var(--primary); }
    .role-card.seller mat-icon:first-child { color: #059669; }
    .role-card.manager mat-icon:first-child { color: #7c3aed; }
    .role-card div { flex: 1; }
    .role-card strong { display: block; font-size: 1rem; }
    .role-card span { font-size: 0.8125rem; color: var(--text-muted); }
    .arrow { color: var(--text-muted); }
  `],
})
export class LoginChooserComponent {}
