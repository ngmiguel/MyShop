import { Component, inject, OnInit, signal } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { CatalogService } from '../../../core/services/catalog.service';

import { OnboardingService } from '../../../core/services/onboarding.service';

import { UserService } from '../../../core/services/user.service';

import { categoryLabel } from '../../../core/data/categories';

import { Product, Store } from '../../../core/models';

import { scoreProducts, ScoredProduct } from '../../../core/utils/recommend.util';

import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';

import { SegmentedTabsComponent } from '../../../shared/components/segmented-tabs/segmented-tabs.component';

import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

import {

  DEFAULT_FILTERS,

  FeedFilterState,

  FeedFiltersComponent,

} from '../../../shared/components/feed-filters/feed-filters.component';



type FeedTab = 'foryou' | 'all' | 'near';

const PAGE_SIZE = 24;



@Component({

  selector: 'app-feed',

  standalone: true,

  imports: [

    MatIconModule, ProductCardComponent, SegmentedTabsComponent,

    EmptyStateComponent, FeedFiltersComponent,

  ],

  template: `

    <div class="feed">

      <header class="feed-head">

        <div>

          <h1>{{ query() ? 'Résultats pour « ' + query() + ' »' : 'Le catalogue de toutes les boutiques' }}</h1>

          <p class="meta">

            <mat-icon>location_on</mat-icon>

            {{ onboarding.state().city }} · rayon {{ onboarding.state().radiusKm }} km · {{ stores().length }} boutiques

          </p>

        </div>

        <app-segmented-tabs

          [items]="feedTabs"

          [value]="tab()"

          (valueChange)="setTab($event)"

        />

      </header>



      <app-feed-filters

        [value]="filters()"

        [stores]="stores()"

        [open]="filtersOpen()"

        [resultCount]="filtered().length"

        (valueChange)="onFiltersChange($event)"

        (toggle)="filtersOpen.set(!filtersOpen())"

        (reset)="resetFilters()"

      />



      @if (loading()) {

        <div class="masonry">

          @for (i of skeletons; track i) {

            <div class="skeleton" [style.height.px]="200 + (i % 3) * 60"></div>

          }

        </div>

      } @else if (visible().length === 0) {

        <app-empty-state

          icon="search_off"

          title="Aucun article ne correspond"

          [message]="emptyMessage()"

        />

        <div class="empty-actions">

          @if (tab() === 'foryou') {

            <button type="button" class="btn-primary" (click)="setTab('all')">Explorer tout le catalogue</button>

          } @else {

            <button type="button" class="btn-outline" (click)="resetFilters()">Réinitialiser les filtres</button>

          }

        </div>

      } @else {

        <div class="masonry">

          @for (item of visible(); track item.product.id) {

            <app-product-card

              [product]="item.product"

              [distance]="item.distance"

              [ratingValue]="item.rating"

              [isFavorite]="userService.isFavorite(item.product.id)"

              (favoriteToggle)="toggleFavorite($event)"

            />

          }

        </div>

        @if (visible().length < filtered().length) {

          <div class="load-more">

            <button type="button" class="btn-outline" (click)="showMore()">

              Afficher plus ({{ filtered().length - visible().length }} restants)

            </button>

          </div>

        }

      }

    </div>

  `,

  styles: [`

    .feed { display: flex; flex-direction: column; gap: 20px; }

    .feed-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }

    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; color: rgb(var(--ink)); }

    .meta { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }

    .meta mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .skeleton {
      break-inside: avoid;
      border-radius: 12px;

      border: 1px solid rgb(var(--line));

      background: rgb(var(--surface));

      animation: pulse 1.5s ease-in-out infinite;

    }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .load-more { display: flex; justify-content: center; padding-top: 8px; }

    .empty-actions { display: flex; justify-content: center; gap: 8px; margin-top: 12px; }

  `],

})

export class FeedComponent implements OnInit {

  private readonly catalog = inject(CatalogService);

  private readonly route = inject(ActivatedRoute);

  readonly userService = inject(UserService);

  readonly onboarding = inject(OnboardingService);



  readonly feedTabs = [

    { id: 'foryou', label: 'Pour vous', icon: 'auto_awesome' },

    { id: 'all', label: 'Tout explorer', icon: 'grid_view' },

    { id: 'near', label: 'Autour de moi', icon: 'explore' },

  ];

  readonly skeletons = Array.from({ length: 12 }, (_, i) => i);



  products = signal<Product[]>([]);

  stores = signal<Store[]>([]);

  loading = signal(true);

  tab = signal<FeedTab>('foryou');

  query = signal('');

  filtersOpen = signal(false);

  filters = signal<FeedFilterState>({ ...DEFAULT_FILTERS });

  pageSize = signal(PAGE_SIZE);

  filtered = signal<ScoredProduct[]>([]);

  visible = signal<ScoredProduct[]>([]);



  ngOnInit(): void {

    this.catalog.getStores().subscribe({ next: (s) => this.stores.set(s) });

    this.route.queryParams.subscribe((p) => {

      this.query.set(p['q'] ?? '');

      this.applyFilters();

    });

    this.loadProducts();

  }



  setTab(id: string): void {

    this.tab.set(id as FeedTab);

    this.pageSize.set(PAGE_SIZE);

    this.applyFilters();

  }



  onFiltersChange(f: FeedFilterState): void {

    this.filters.set(f);

    this.pageSize.set(PAGE_SIZE);

    this.applyFilters();

  }



  resetFilters(): void {

    this.filters.set({ ...DEFAULT_FILTERS });

    this.pageSize.set(PAGE_SIZE);

    this.applyFilters();

  }



  toggleFavorite(productId: string): void {

    this.userService.toggleFavorite(productId);

  }



  showMore(): void {

    this.pageSize.update((n) => n + PAGE_SIZE);

    this.applyFilters();

  }



  emptyMessage(): string {

    return this.tab() === 'foryou'

      ? 'Élargissez vos centres d\'intérêt ou explorez tout le catalogue.'

      : 'Essayez d\'élargir le rayon ou retirer un filtre.';

  }



  private loadProducts(): void {

    this.loading.set(true);

    this.catalog.getProducts({ limit: 200 }).subscribe({

      next: (res) => {

        this.products.set(res.data ?? []);

        setTimeout(() => {

          this.loading.set(false);

          this.applyFilters();

        }, 320);

      },

      error: () => {

        this.loading.set(false);

        this.applyFilters();

      },

    });

  }



  private applyFilters(): void {

    const needle = this.query().trim().toLowerCase();

    const prefs = this.onboarding.state();

    const f = this.filters();

    const favorites = this.userService.getFavorites().map((f) => f.productId);



    let list = scoreProducts(this.products(), prefs, favorites).filter(({ product, distance, rating }) => {

      if (needle) {

        const hay = `${product.name} ${product.description ?? ''} ${product.storeName ?? ''} ${categoryLabel(product.categoryId ?? '')}`.toLowerCase();

        if (!hay.includes(needle)) return false;

      }

      if (f.category !== 'all' && product.categoryId !== f.category) return false;

      if (f.subcategory !== 'all' && product.subcategoryId !== f.subcategory) return false;

      if (f.storeId !== 'all' && product.storeId !== f.storeId) return false;

      if (product.price > f.maxPrice) return false;

      if (distance > f.maxDistance) return false;

      if (rating < f.minRating) return false;

      if (f.inStockOnly && product.stock <= 0) return false;

      if (this.tab() === 'near' && distance > prefs.radiusKm) return false;

      if (this.tab() === 'foryou' && prefs.categories.length && product.categoryId && !prefs.categories.includes(product.categoryId)) return false;

      return true;

    });



    list = [...list].sort((a, b) => {

      switch (f.sort) {

        case 'prix_asc': return a.product.price - b.product.price;

        case 'prix_desc': return b.product.price - a.product.price;

        case 'nouveaute': return b.product.name.localeCompare(a.product.name);

        case 'proximite': return a.distance - b.distance;

        default: return b.score - a.score;

      }

    });



    this.filtered.set(list);

    this.visible.set(list.slice(0, this.pageSize()));

  }

}


