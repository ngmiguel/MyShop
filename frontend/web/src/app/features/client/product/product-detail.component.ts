import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogService } from '../../../core/services/catalog.service';
import { OrderService } from '../../../core/services/order.service';
import { UserService } from '../../../core/services/user.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CurrencyPipe, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule,
    PageHeaderComponent, LoadingSpinnerComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (product()) {
      <app-page-header [title]="product()!.name" [showBack]="true" backLink="/client/feed">
        <button mat-icon-button (click)="toggleFavorite()">
          <mat-icon>{{ isFavorite ? 'favorite' : 'favorite_border' }}</mat-icon>
        </button>
      </app-page-header>

      <div class="product-detail">
        <div class="hero-image">
          @if (product()!.imageUrl) {
            <img [src]="product()!.imageUrl" [alt]="product()!.name" />
          } @else {
            <mat-icon>inventory_2</mat-icon>
          }
        </div>

        <div class="info-section">
          @if (product()!.storeName) {
            <a [routerLink]="['/client/store', product()!.storeId]" class="store-link">
              <mat-icon>store</mat-icon> {{ product()!.storeName }}
            </a>
          }
          <div class="price-block">
            <span class="price">{{ product()!.price | currency: product()!.currency:'symbol-narrow':'1.0-0' }}</span>
            @if (product()!.compareAtPrice && product()!.compareAtPrice! > product()!.price) {
              <span class="compare">{{ product()!.compareAtPrice | currency: product()!.currency:'symbol-narrow':'1.0-0' }}</span>
            }
          </div>
          @if (product()!.description) {
            <p class="description">{{ product()!.description }}</p>
          }
          <div class="stock-info">
            @if (product()!.stock > 0) {
              <mat-icon>check_circle</mat-icon> En stock ({{ product()!.stock }})
            } @else {
              <mat-icon color="warn">cancel</mat-icon> Rupture de stock
            }
          </div>
        </div>

        <div class="actions">
          <button mat-flat-button color="primary" class="add-btn" [disabled]="product()!.stock <= 0 || adding()" (click)="addToCart()">
            <mat-icon>add_shopping_cart</mat-icon>
            Ajouter au panier
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .product-detail { padding-bottom: 24px; }
    .hero-image {
      aspect-ratio: 1;
      background: var(--surface-alt);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-image img { width: 100%; height: 100%; object-fit: cover; }
    .hero-image mat-icon { font-size: 80px; width: 80px; height: 80px; color: var(--text-muted); }
    .info-section { padding: 16px; }
    .store-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      color: var(--primary);
      text-decoration: none;
      margin-bottom: 8px;
    }
    .price-block { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
    .price { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
    .compare { font-size: 1rem; color: var(--text-muted); text-decoration: line-through; }
    .description { font-size: 0.875rem; line-height: 1.6; color: var(--text-muted); }
    .stock-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 0.875rem;
    }
    .actions { padding: 0 16px; }
    .add-btn { width: 100%; height: 48px; font-size: 1rem; }
  `],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly orderService = inject(OrderService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  product = signal<Product | null>(null);
  loading = signal(true);
  adding = signal(false);
  isFavorite = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.catalog.getProduct(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.isFavorite = this.userService.isFavorite(p.id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleFavorite(): void {
    const p = this.product();
    if (!p) return;
    this.isFavorite = this.userService.toggleFavorite(p.id);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.adding.set(true);
    this.orderService.addToCart(p.id).subscribe({
      next: () => {
        this.snackBar.open('Produit ajoute au panier', 'Voir', { duration: 3000 });
        this.adding.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'Fermer', { duration: 3000 });
        this.adding.set(false);
      },
    });
  }
}
