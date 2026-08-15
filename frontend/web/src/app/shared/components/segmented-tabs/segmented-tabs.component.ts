import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface SegmentedTab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-segmented-tabs',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="tabs" [class.sm]="size === 'sm'" role="tablist">
      @for (item of items; track item.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="value === item.id"
          class="tab"
          [class.active]="value === item.id"
          (click)="valueChange.emit(item.id)"
        >
          @if (value === item.id) {
            <span class="pill"></span>
          }
          <span class="tab-content">
            @if (item.icon) {
              <mat-icon>{{ item.icon }}</mat-icon>
            }
            {{ item.label }}
          </span>
        </button>
      }
    </div>
  `,
  styles: [`
    .tabs {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      background: rgb(var(--surface-2));
    }
    .tabs.sm .tab { padding: 4px 12px; font-size: 11px; }
    .tab {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 999px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 500;
      color: rgb(var(--muted));
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s;
    }
    .tab:hover:not(.active) { color: rgb(var(--ink)); }
    .tab.active { color: white; }
    .pill {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: rgb(var(--accent));
      z-index: 0;
    }
    .tab-content {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class SegmentedTabsComponent {
  @Input({ required: true }) items!: SegmentedTab[];
  @Input({ required: true }) value!: string;
  @Input() size: 'sm' | 'md' = 'md';
  @Output() valueChange = new EventEmitter<string>();
}
