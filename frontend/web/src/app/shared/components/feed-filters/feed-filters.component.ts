import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CATEGORIES } from '../../../core/data/categories';
import { Store } from '../../../core/models';

export interface FeedFilterState {
  category: string;
  subcategory: string;
  storeId: string;
  maxPrice: number;
  maxDistance: number;
  minRating: number;
  inStockOnly: boolean;
  sort: 'pertinence' | 'prix_asc' | 'prix_desc' | 'nouveaute' | 'proximite';
}

export const DEFAULT_FILTERS: FeedFilterState = {
  category: 'all',
  subcategory: 'all',
  storeId: 'all',
  maxPrice: 10_000_000,
  maxDistance: 500,
  minRating: 0,
  inStockOnly: false,
  sort: 'pertinence',
};

@Component({
  selector: 'app-feed-filters',
  standalone: true,
  imports: [DecimalPipe, FormsModule, MatIconModule],
  template: `
    <div class="filters-card">
      <div class="filters-row">
        <button type="button" class="filter-btn" [class.active]="activeCount > 0" (click)="toggle.emit()">
          <mat-icon>tune</mat-icon>
          Filtres
          @if (activeCount > 0) {
            <span class="count-badge">{{ activeCount }}</span>
          }
        </button>

        <div class="chips-scroll">
          @for (c of categories; track c.id) {
            <button
              type="button"
              class="chip"
              [class.chip--active]="value.category === c.id"
              (click)="toggleCategory(c.id)"
            >{{ c.label }}</button>
          }
        </div>

        <select class="sort-select" [ngModel]="value.sort" (ngModelChange)="patch({ sort: $event })">
          <option value="pertinence">Pertinence</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
          <option value="nouveaute">Nouveautés</option>
          <option value="proximite">Proximité</option>
        </select>
      </div>

      @if (open) {
        <div class="filters-panel">
          <div class="field">
            <label>Sous-catégorie</label>
            <select [ngModel]="value.subcategory" (ngModelChange)="patch({ subcategory: $event })" [disabled]="!subcategories.length">
              <option value="all">Toutes</option>
              @for (s of subcategories; track s.id) {
                <option [value]="s.id">{{ s.label }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Boutique</label>
            <select [ngModel]="value.storeId" (ngModelChange)="patch({ storeId: $event })">
              <option value="all">Toutes les boutiques</option>
              @for (s of stores; track s.id) {
                <option [value]="s.id">{{ s.name }} · {{ s.city }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label>Prix maximum : {{ value.maxPrice | number:'1.0-0' }} FCFA</label>
            <input type="range" min="5000" max="10000000" step="5000" [ngModel]="value.maxPrice" (ngModelChange)="patch({ maxPrice: +$event })" />
          </div>
          <div class="field">
            <label>Distance maximum : {{ value.maxDistance }} km</label>
            <input type="range" min="2" max="500" step="2" [ngModel]="value.maxDistance" (ngModelChange)="patch({ maxDistance: +$event })" />
          </div>
          <div class="field">
            <label>Note minimale : {{ value.minRating.toFixed(1) }}</label>
            <input type="range" min="0" max="5" step="0.5" [ngModel]="value.minRating" (ngModelChange)="patch({ minRating: +$event })" />
          </div>
          <label class="checkbox-row">
            <input type="checkbox" [ngModel]="value.inStockOnly" (ngModelChange)="patch({ inStockOnly: $event })" />
            Disponible en boutique uniquement
          </label>
          <div class="panel-footer">
            <span class="result-hint">{{ resultCount }} article(s) correspondent</span>
            <button type="button" class="btn-outline sm" (click)="reset.emit()">
              <mat-icon>close</mat-icon> Réinitialiser
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters-card {
      border-radius: 12px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
    }
    .filters-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 12px;
    }
    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      font-size: 14px;
      font-weight: 500;
      color: rgb(var(--muted));
      cursor: pointer;
    }
    .filter-btn.active {
      border-color: rgb(var(--accent));
      background: rgba(var(--accent), 0.1);
      color: rgb(var(--accent));
    }
    .filter-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .count-badge {
      border-radius: 999px;
      background: rgb(var(--accent));
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 0 6px;
    }
    .chips-scroll {
      display: flex;
      flex: 1;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .sort-select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      font-size: 12px;
      color: rgb(var(--ink));
    }
    .filters-panel {
      display: grid;
      gap: 16px;
      border-top: 1px solid rgb(var(--line));
      padding: 16px;
    }
    @media (min-width: 640px) { .filters-panel { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .filters-panel { grid-template-columns: repeat(4, 1fr); } }
    .field label { display: block; font-size: 12px; font-weight: 600; color: rgb(var(--ink)); margin-bottom: 6px; }
    .field select, .field input[type=range] { width: 100%; }
    .field select {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      font-size: 14px;
    }
    .field input[type=range] { accent-color: rgb(var(--accent)); margin-top: 8px; }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: rgb(var(--ink));
    }
    .panel-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    @media (min-width: 640px) { .panel-footer { grid-column: span 2; } }
    @media (min-width: 1024px) { .panel-footer { grid-column: span 2; } }
    .result-hint { font-size: 12px; color: rgb(var(--muted)); }
    .btn-outline.sm {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      font-size: 13px;
      cursor: pointer;
    }
    .btn-outline.sm mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class FeedFiltersComponent {
  @Input({ required: true }) value!: FeedFilterState;
  @Input({ required: true }) stores!: Store[];
  @Input() open = false;
  @Input() resultCount = 0;
  @Output() valueChange = new EventEmitter<FeedFilterState>();
  @Output() toggle = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  readonly categories = CATEGORIES;

  get subcategories() {
    return CATEGORIES.find((c) => c.id === this.value.category)?.subcategories ?? [];
  }

  get activeCount(): number {
    const v = this.value;
    return (
      (v.category !== 'all' ? 1 : 0) +
      (v.subcategory !== 'all' ? 1 : 0) +
      (v.storeId !== 'all' ? 1 : 0) +
      (v.maxPrice < DEFAULT_FILTERS.maxPrice ? 1 : 0) +
      (v.maxDistance < DEFAULT_FILTERS.maxDistance ? 1 : 0) +
      (v.minRating > 0 ? 1 : 0) +
      (v.inStockOnly ? 1 : 0)
    );
  }

  toggleCategory(id: string): void {
    const next = this.value.category === id ? 'all' : id;
    this.patch({ category: next, subcategory: 'all' });
  }

  patch(partial: Partial<FeedFilterState>): void {
    this.valueChange.emit({ ...this.value, ...partial });
  }
}
