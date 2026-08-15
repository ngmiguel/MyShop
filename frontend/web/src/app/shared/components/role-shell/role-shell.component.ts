import { Component, inject, Input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeQuickToggleComponent } from '../theme-quick-toggle/theme-quick-toggle.component';

export interface ShellNavItem {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-role-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, ThemeQuickToggleComponent],
  template: `
    <div class="shell">
      <aside class="sidebar" [class]="accentClass">
        <div class="sidebar-head">
          <span class="mark" [class]="accentClass">B</span>
          <div>
            <p class="title">{{ title }}</p>
            <p class="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <nav class="sidebar-nav" aria-label="Navigation de section">
          @for (item of items; track item.to) {
            <a [routerLink]="item.to" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact ?? false }">
              <mat-icon>{{ item.icon }}</mat-icon>
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="sidebar-foot">
          @if (badge) {
            <div class="badge-slot"><ng-content select="[shellBadge]" /></div>
          }
          <a routerLink="/client/feed" class="foot-link">
            <mat-icon>storefront</mat-icon>
            Catalogue public
          </a>
          <button type="button" class="foot-link logout" (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            Se deconnecter
          </button>
        </div>
      </aside>

      <div class="main-col">
        <header class="mobile-header">
          <button type="button" class="menu-btn" (click)="drawerOpen = true" aria-label="Ouvrir le menu">
            <mat-icon>menu</mat-icon>
          </button>
          <p class="mobile-title">{{ title }}</p>
          <app-theme-quick-toggle />
        </header>

        @if (drawerOpen) {
          <div class="drawer-backdrop" (click)="drawerOpen = false">
            <aside class="drawer" [class]="accentClass" (click)="$event.stopPropagation()">
              <div class="drawer-head">
                <p>{{ title }}</p>
                <button type="button" (click)="drawerOpen = false" aria-label="Fermer">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <nav class="sidebar-nav">
                @for (item of items; track item.to) {
                  <a [routerLink]="item.to" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact ?? false }" (click)="drawerOpen = false">
                    <mat-icon>{{ item.icon }}</mat-icon>
                    {{ item.label }}
                  </a>
                }
              </nav>
              <div class="sidebar-foot">
                <a routerLink="/client/feed" class="foot-link" (click)="drawerOpen = false">
                  <mat-icon>storefront</mat-icon>
                  Catalogue public
                </a>
                <button type="button" class="foot-link logout" (click)="auth.logout()">
                  <mat-icon>logout</mat-icon>
                  Se deconnecter
                </button>
              </div>
            </aside>
          </div>
        }

        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      min-height: 100dvh;
      display: flex;
      background: rgb(var(--canvas));
    }
    .sidebar {
      display: none;
      width: 256px;
      flex-shrink: 0;
      flex-direction: column;
      border-right: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
    }
    @media (min-width: 1024px) { .sidebar { display: flex; } }

    .sidebar-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid rgb(var(--line));
    }
    .mark {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      color: white;
    }
    .mark.amber { background: rgb(217 119 6); }
    .mark.indigo { background: rgb(67 56 202); }
    .title { margin: 0; font-size: 14px; font-weight: 600; color: rgb(var(--ink)); }
    .subtitle { margin: 0; font-size: 12px; color: rgb(var(--muted)); }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      flex: 1;
    }
    .sidebar-nav a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      color: rgb(var(--muted));
      background: rgb(var(--surface-2));
      border: 1px solid transparent;
      transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .sidebar-nav a:hover {
      color: rgb(var(--ink));
      background: rgb(var(--surface-2));
      border-color: rgb(var(--line));
    }
    .sidebar-nav a.active {
      font-weight: 600;
      border-color: transparent;
      box-shadow: inset 3px 0 0 currentColor;
    }
    .sidebar.indigo .sidebar-nav a.active {
      background: rgba(67, 56, 202, 0.14);
      color: rgb(67 56 202);
    }
    .sidebar.amber .sidebar-nav a.active {
      background: rgba(217, 119, 6, 0.14);
      color: rgb(217 119 6);
    }
    .drawer.indigo .sidebar-nav a.active {
      background: rgba(67, 56, 202, 0.14);
      color: rgb(67 56 202);
    }
    .drawer.amber .sidebar-nav a.active {
      background: rgba(217, 119, 6, 0.14);
      color: rgb(217 119 6);
    }
    .sidebar-nav mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .sidebar-foot {
      border-top: 1px solid rgb(var(--line));
      padding: 12px;
    }
    .badge-slot { margin-bottom: 8px; }
    .foot-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      border: 1px solid transparent;
      background: rgb(var(--surface-2));
      border-radius: 8px;
      font-size: 14px;
      color: rgb(var(--muted));
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .foot-link:hover {
      color: rgb(var(--ink));
      border-color: rgb(var(--line));
    }
    .foot-link.logout:hover { color: #f43f5e; }

    .main-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .mobile-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid rgb(var(--line));
      background: rgba(var(--surface), 0.95);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 30;
    }
    @media (min-width: 1024px) {
      .mobile-header { justify-content: flex-end; }
      .menu-btn, .mobile-title { display: none; }
    }
    .menu-btn {
      border: none;
      background: none;
      border-radius: 8px;
      padding: 8px;
      color: rgb(var(--muted));
      cursor: pointer;
    }
    .mobile-title { flex: 1; margin: 0; font-size: 14px; font-weight: 600; }

    .drawer-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(15, 23, 42, 0.5);
    }
    @media (min-width: 1024px) { .drawer-backdrop { display: none; } }
    .drawer {
      width: 288px;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: rgb(var(--surface));
      border-right: 1px solid rgb(var(--line));
    }
    .drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgb(var(--line));
    }
    .drawer-head p { margin: 0; font-weight: 600; }
    .drawer-head button { border: none; background: none; cursor: pointer; color: rgb(var(--muted)); }

    .content { flex: 1; padding: 24px 16px; min-width: 0; }
  `],
})
export class RoleShellComponent {
  readonly auth = inject(AuthService);

  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) accentClass!: 'amber' | 'indigo';
  @Input({ required: true }) items!: ShellNavItem[];
  @Input() badge = false;

  drawerOpen = false;
}
