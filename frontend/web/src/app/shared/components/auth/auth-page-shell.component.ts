import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeQuickToggleComponent } from '../theme-quick-toggle/theme-quick-toggle.component';

@Component({
  selector: 'app-auth-page-shell',
  standalone: true,
  imports: [RouterLink, MatIconModule, ThemeQuickToggleComponent],
  template: `
    <div class="auth-shell">
      <header class="auth-header">
        <a [routerLink]="backLink" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
          {{ backLabel }}
        </a>
        <app-theme-quick-toggle />
      </header>
      <main class="auth-main">
        <ng-content />
      </main>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: rgb(var(--canvas));
    }
    .auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      padding: 12px 16px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: rgb(var(--muted));
      text-decoration: none;
      padding: 6px 10px;
      border-radius: 8px;
    }
    .back-btn:hover { background: rgb(var(--surface-2)); color: rgb(var(--ink)); }
    .back-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .auth-main {
      flex: 1;
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      padding: 40px 16px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  `],
})
export class AuthPageShellComponent {
  @Input() backLabel = 'Retour';
  @Input() backLink = '/auth/login';
}
