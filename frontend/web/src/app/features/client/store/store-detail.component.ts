import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { StoreService } from '../../../core/services/store.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Product, Store } from '../../../core/models';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [MatIconModule, PageHeaderComponent, ProductCardComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (store()) {
      <app-page-header [title]="store()!.name" [showBack]="true" backLink="/client/feed" />

      <div class="store-detail">
        <div class="store-banner">
          @if (store()!.coverUrl) {
            <img [src]="store()!.coverUrl" [alt]="store()!.name" />
          }
          <div class="store-meta">
            @if (store()!.city) {
              <span><mat-icon>location_on</mat-icon> {{ store()!.city }}</span>
            }
            @if (store()!.description) {
              <p>{{ store()!.description }}</p>
            }
          </div>
        </div>

        <h2 class="section-title">Produits</h2>
        <div class="product-grid">
          @for (product of products(); track product.id) {
            <app-product-card [product]="product" [showFavorite]="false" />
          } @empty {
            <p class="empty">Aucun produit dans cette boutique.</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .store-banner { background: var(--surface); margin-bottom: 16px; }
    .store-banner img { width: 100%; height: 160px; object-fit: cover; }
    .store-meta { padding: 12px 16px; }
    .store-meta span { display: flex; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--text-muted); }
    .store-meta p { margin: 8px 0 0; font-size: 0.875rem; color: var(--text-muted); }
    .section-title { padding: 0 16px; font-size: 1rem; margin-bottom: 12px; }
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 0 16px 24px;
    }
    .empty { grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 24px; }
  `],
})
export class StoreDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storeService = inject(StoreService);
  private readonly catalog = inject(CatalogService);

  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.storeService.getStore(id).subscribe({
      next: (s) => {
        this.store.set(s);
        this.loadProducts(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadProducts(storeId: string): void {
    this.catalog.getProducts({ storeId, limit: 40 }).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
