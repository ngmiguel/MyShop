import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    RouterLink, MatButtonModule, PageHeaderComponent, ProductCardComponent,
    LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="Mes favoris" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (products().length === 0) {
      <app-empty-state icon="favorite" title="Aucun favori" message="Ajoutez des produits a vos favoris depuis le catalogue.">
        <a mat-flat-button color="primary" routerLink="/client/feed">Parcourir</a>
      </app-empty-state>
    } @else {
      <div class="product-grid">
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
    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
    }
  `],
})
export class FavoritesComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly catalog = inject(CatalogService);

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
        this.products.set(products);
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
