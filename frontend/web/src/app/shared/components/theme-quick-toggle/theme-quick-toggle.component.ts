import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-quick-toggle',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button type="button" class="theme-btn" (click)="theme.cycleMode()" [attr.aria-label]="'Theme: ' + theme.modeLabel()">
      @switch (theme.settings().theme) {
        @case ('light') { <mat-icon>light_mode</mat-icon> }
        @case ('dark') { <mat-icon>dark_mode</mat-icon> }
        @default { <mat-icon>brightness_auto</mat-icon> }
      }
    </button>
  `,
  styles: [`
    .theme-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 8px;
      padding: 8px;
      color: rgb(var(--muted));
      cursor: pointer;
    }
    .theme-btn:hover {
      background: rgb(var(--surface-2));
      color: rgb(var(--ink));
    }
    mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `],
})
export class ThemeQuickToggleComponent {
  readonly theme = inject(ThemeService);
}
