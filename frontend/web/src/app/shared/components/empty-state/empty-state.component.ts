import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <div class="icon-wrap">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      border: 1px dashed rgb(var(--line));
      border-radius: 12px;
      background: rgb(var(--surface));
    }
    .icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 999px;
      background: rgb(var(--surface-2));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      color: rgb(var(--muted));
    }
    .icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; }
    h3 {
      margin: 0 0 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: rgb(var(--ink));
    }
    p { margin: 0; font-size: 0.875rem; max-width: 360px; color: rgb(var(--muted)); }
  `],
})
export class EmptyStateComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) message!: string;
}
