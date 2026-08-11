import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { CatalogService } from '../../core/services/catalog.service';
import { UserService } from '../../core/services/user.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Product, Category } from '../../core/models';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatIconModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, ProductCardComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <div class="feed">
      <header class="feed-header">
        <div class="brand-row">
          <mat-icon class="logo">storefront</mat-icon>
          <h1>MyShop</h1>
          <a routerLink="/auth/login" class="auth-link">
            <mat-icon>login</mat-icon>
          </a>
        </div>
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Rechercher un produit..." [(ngModel)]="search" (ngModelChange)="onSearch()" />
        </mat-form-field>
      </header>

      @if (categories().length) {
        <div class="categories">
          <button class="cat-chip" [class.active]="!selectedCategory()" (click)="selectCategory(null)">Tout</button>
          @for (cat of categories(); track cat.id) {
            <button class="cat-chip" [class.active]="selectedCategory() === cat.id" (click)="selectCategory(cat.id)">
              {{ cat.name }}
            </button>
          }
        </div>
      }

      @if (loading()) {
        <app-loading-spinner />
      } @else if (products().length === 0) {
        <app-empty-state icon="inventory_2" title="Aucun produit" message="Aucun produit ne correspond a votre recherche." />
      } @else {
        <div class="product-grid">
          @for (product of products(); track product.id) {
            <app-product-card
              [product]="product"
              [isFavorite]="userService.isFavorite(product.id)"
              (favoriteToggle)="toggleFavorite($event)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .feed { padding-bottom: 16px; }
    .feed-header {
      padding: 16px 16px 8px;
      background: var(--surface);
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: 1px solid var(--border);
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .logo { color: var(--primary); }
    h1 { flex: 1; margin: 0; font-size: 1.25rem; font-weight: 700; }
    .auth-link { color: var(--text-muted); }
    .search-field { width: 100%; }
    .categories {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .cat-chip {
      flex-shrink: 0;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: var(--surface);
      font-size: 0.8125rem;
      cursor: pointer;
      white-space: nowrap;
    }
    .cat-chip.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 0 16px;
    }
  `],
})
export class FeedComponent implements OnInit {
  readonly catalog = inject(CatalogService);
  readonly userService = inject(UserService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);
  search = '';
  selectedCategory = signal<string | null>(null);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 300);
  }

  selectCategory(id: string | null): void {
    this.selectedCategory.set(id);
    this.loadProducts();
  }

  toggleFavorite(productId: string): void {
    this.userService.toggleFavorite(productId);
  }

  private loadCategories(): void {
    this.catalog.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([]),
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.catalog.getProducts({
      search: this.search || undefined,
      categoryId: this.selectedCategory() ?? undefined,
      inStock: true,
      limit: 40,
    }).subscribe({
      next: (res) => {
        this.products.set(res.data ?? (res as unknown as Product[]));
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      },
    });
  }
}
