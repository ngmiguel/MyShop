import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterLink],
  template: `
    <header class="page-header">
      @if (showBack) {
        <button mat-icon-button routerLink="{{ backLink }}" aria-label="Retour">
          <mat-icon>arrow_back</mat-icon>
        </button>
      } @else {
        <div class="spacer-icon"></div>
      }
      <div class="header-content">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p>{{ subtitle }}</p>
        }
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .header-content {
      flex: 1;
      min-width: 0;
    }
    h1 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    p {
      margin: 2px 0 0;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .spacer-icon { width: 40px; }
    .header-actions { display: flex; align-items: center; gap: 4px; }
  `],
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() showBack = false;
  @Input() backLink = '..';
}
