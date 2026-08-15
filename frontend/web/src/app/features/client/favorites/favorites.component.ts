import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { CatalogImageService } from '../../../core/services/catalog-image.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    RouterLink, ProductCardComponent,
    LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <header class="page-head">
      <h1 class="page-title">Mes favoris</h1>
      @if (products().length) {
        <span class="count">{{ products().length }} article(s)</span>
      }
    </header>

    @if (loading()) {
      <app-loading-spinner />
    } @else if (products().length === 0) {
      <app-empty-state icon="favorite" title="Aucun favori" message="Ajoutez des produits a vos favoris depuis le catalogue.">
        <button type="button" class="btn-primary" routerLink="/client/feed">Parcourir le catalogue</button>
      </app-empty-state>
    } @else {
      <div class="masonry">
        @for (product of products(); track product.id) {
          <app-product-card
            [product]="product"
            [isFavorite]="true"
            (favoriteToggle)="removeFavorite($event)"
          />
        }
      </div>
    }
  `,
  styles: [`
    .page-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 20px; }
    .count { font-size: 14px; color: rgb(var(--muted)); }
  `],
})
export class FavoritesComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly catalog = inject(CatalogService);
  private readonly images = inject(CatalogImageService);

  products = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const favorites = this.userService.getFavorites();
    if (favorites.length === 0) {
      this.loading.set(false);
      return;
    }

    forkJoin(favorites.map((f) => this.catalog.getProduct(f.productId))).subscribe({
      next: (products) => {
        this.products.set(this.images.enrichProducts(products));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  removeFavorite(productId: string): void {
    this.userService.toggleFavorite(productId);
    this.products.update((list) => list.filter((p) => p.id !== productId));
  }
}
