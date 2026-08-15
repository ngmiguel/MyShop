import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { categoryLabel } from '../../../core/data/categories';
import { ManagerInsightsService } from '../../../core/services/manager-insights.service';
import { SegmentedTabsComponent } from '../segmented-tabs/segmented-tabs.component';

const PERIODS = [
  { id: '30', label: '30 j' },
  { id: '90', label: '90 j' },
  { id: '180', label: '180 j' },
];

@Component({
  selector: 'app-manager-insights-filters',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, SegmentedTabsComponent],
  template: `
    <div class="filters-row">
      @if (showPeriod()) {
        <app-segmented-tabs
          size="sm"
          [items]="periods"
          [value]="filters.period()"
          (valueChange)="filters.period.set($event)"
        />
      }
      <div class="filters card">
        <select
          [ngModel]="filters.storeFilter()"
          (ngModelChange)="filters.storeFilter.set($event)"
          aria-label="Boutique"
          class="filter-select"
        >
          <option value="all">Toutes les boutiques</option>
          @for (s of filters.stores(); track s.id) {
            <option [value]="s.id">{{ s.name }}</option>
          }
        </select>
        <select
          [ngModel]="filters.categoryFilter()"
          (ngModelChange)="filters.categoryFilter.set($event)"
          aria-label="Catégorie"
          class="filter-select"
        >
          <option value="all">Toutes les catégories</option>
          @for (c of filters.categories; track c.id) {
            <option [value]="c.id">{{ c.label }}</option>
          }
        </select>
        <select
          [ngModel]="filters.sellerFilter()"
          (ngModelChange)="filters.sellerFilter.set($event)"
          aria-label="Vendeur"
          class="filter-select"
        >
          <option value="all">Tous les vendeurs</option>
          @for (s of filters.filteredSellers(); track s.id) {
            <option [value]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
          }
        </select>
        <select
          [ngModel]="filters.channelFilter()"
          (ngModelChange)="filters.channelFilter.set($event)"
          aria-label="Canal"
          class="filter-select"
        >
          <option value="all">Tous les canaux</option>
          <option value="feed">Fil</option>
          <option value="search">Recherche</option>
          <option value="store_page">Page boutique</option>
          <option value="recommendation">Recommandation</option>
        </select>
        @if (showReset()) {
          <button type="button" class="btn-outline" (click)="filters.resetFilters()">
            <mat-icon>filter_alt_off</mat-icon>
            Réinitialiser
          </button>
        }
      </div>
    </div>

    @if (filters.activeFilterCount() > 0) {
      <div class="active-filters">
        @if (filters.storeFilter() !== 'all') {
          <span class="chip">Boutique : {{ filters.storeName(filters.storeFilter()) }}</span>
        }
        @if (filters.categoryFilter() !== 'all') {
          <span class="chip">Catégorie : {{ categoryLabel(filters.categoryFilter()) }}</span>
        }
        @if (filters.sellerFilter() !== 'all') {
          <span class="chip">Vendeur : {{ filters.sellerName(filters.sellerFilter()) }}</span>
        }
        @if (filters.channelFilter() !== 'all') {
          <span class="chip">Canal : {{ channelLabel(filters.channelFilter()) }}</span>
        }
      </div>
    }
  `,
  styles: [`
    .filters-row { display: flex; flex-direction: column; gap: 12px; }
    .filters {
      display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
      padding: 12px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
    }
    .filter-select {
      padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface-2)); font-size: 12px; color: rgb(var(--ink)); cursor: pointer;
    }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
      border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2));
      font-size: 12px; font-weight: 600; cursor: pointer; color: rgb(var(--ink));
    }
    .btn-outline mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .btn-outline:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .active-filters { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
      background: rgba(5, 150, 105, 0.1); color: #047857;
    }
  `],
})
export class ManagerInsightsFiltersComponent {
  readonly filters = inject(ManagerInsightsService);
  readonly categoryLabel = categoryLabel;
  readonly periods = PERIODS;

  showPeriod = input(true);
  showReset = input(true);

  channelLabel(key: string): string {
    if (key === 'feed') return 'Fil';
    if (key === 'search') return 'Recherche';
    if (key === 'store_page') return 'Page boutique';
    if (key === 'recommendation') return 'Recommandation';
    return key;
  }
}
