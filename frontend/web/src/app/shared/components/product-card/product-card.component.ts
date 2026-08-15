import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Product } from '../../../core/models';
import { CatalogImageService } from '../../../core/services/catalog-image.service';
import { OrderService } from '../../../core/services/order.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { ASPECT_HEIGHT, productAspect } from '../../../core/data/images';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <article class="product-card">
      <a [routerLink]="['/client/product', product.id]" class="card-link">
        <div class="image-wrap" [style.height]="aspectHeight">
          <img class="img" [src]="imageUrl" [alt]="product.name" loading="lazy" referrerpolicy="no-referrer" />
          @if (product.compareAtPrice && product.compareAtPrice > product.price) {
            <span class="badge promo">Promo</span>
          }
          @if (product.stock <= 0) {
            <span class="overlay">Rupture de stock</span>
          }
        </div>
      </a>

      <div class="info">
        <div class="title-row">
          <a [routerLink]="['/client/product', product.id]" class="title">{{ product.name }}</a>
          @if (showFavorite) {
            <button type="button" class="fav" (click)="favoriteToggle.emit(product.id)" [attr.aria-pressed]="isFavorite">
              <mat-icon>{{ isFavorite ? 'favorite' : 'favorite_border' }}</mat-icon>
            </button>
          }
        </div>

        <div class="price-row">
          <span class="price">{{ product.price | currency: product.currency:'symbol-narrow':'1.0-0' }}</span>
          @if (product.compareAtPrice && product.compareAtPrice > product.price) {
            <span class="compare">{{ product.compareAtPrice | currency: product.currency:'symbol-narrow':'1.0-0' }}</span>
          }
        </div>

        <div class="meta-row">
          @if (product.storeName) {
            <a [routerLink]="['/client/store', product.storeId]" class="store">{{ product.storeName }}</a>
          }
          <span class="rating"><mat-icon>star</mat-icon> {{ displayRating }}</span>
        </div>

        <div class="actions-row">
          @if (distance !== undefined) {
            <span class="distance"><mat-icon>location_on</mat-icon> {{ distance }} km</span>
          }
          <button type="button" class="cart-btn" [disabled]="product.stock <= 0" (click)="addToCart($event)">
            <mat-icon>add</mat-icon> Panier
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host {
      display: block;
      break-inside: avoid;
      margin-bottom: 24px;
    }
    .product-card {
      break-inside: avoid;
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      transition: box-shadow 0.2s;
      display: block;
    }
    .product-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
    .image-wrap { position: relative; overflow: hidden; background: rgb(var(--surface-2)); }
    .img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
    .product-card:hover .img { transform: scale(1.04); }
    .badge.promo {
      position: absolute; left: 8px; top: 8px; padding: 2px 8px; border-radius: 999px;
      background: #e11d48; color: white; font-size: 11px; font-weight: 600;
    }
    .overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(15,23,42,0.55); color: white; font-size: 14px; font-weight: 600;
    }
    .info { padding: 12px; }
    .title-row { display: flex; gap: 8px; align-items: flex-start; }
    .title {
      flex: 1; font-size: 14px; font-weight: 500; color: rgb(var(--ink)); text-decoration: none;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .fav { border: none; background: none; padding: 0; color: rgb(var(--muted)); cursor: pointer; }
    .fav:hover { color: #f43f5e; }
    .fav mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .price-row { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
    .price { font-size: 14px; font-weight: 600; color: rgb(var(--ink)); }
    .compare { font-size: 12px; color: rgb(var(--muted)); text-decoration: line-through; }
    .meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: rgb(var(--muted)); }
    .store { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; color: rgb(var(--muted)); text-decoration: none; }
    .store:hover { color: rgb(var(--accent)); }
    .rating { display: inline-flex; align-items: center; gap: 2px; }
    .rating mat-icon { font-size: 12px; width: 12px; height: 12px; color: #fbbf24; }
    .actions-row { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; gap: 8px; }
    .distance { display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: rgb(var(--muted)); }
    .distance mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .cart-btn {
      margin-left: auto; display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 10px; border: none; border-radius: 999px; background: rgb(var(--accent)); color: white;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .cart-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cart-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class ProductCardComponent {
  private readonly images = inject(CatalogImageService);
  private readonly orders = inject(OrderService);
  private readonly cartState = inject(CartStateService);
  private readonly snackBar = inject(MatSnackBar);

  @Input({ required: true }) product!: Product;
  @Input() showFavorite = true;
  @Input() isFavorite = false;
  @Input() distance?: number;
  @Input() ratingValue?: number;
  @Output() favoriteToggle = new EventEmitter<string>();

  get imageUrl(): string {
    return this.images.productImageUrl(this.product);
  }

  get aspectHeight(): string {
    return ASPECT_HEIGHT[productAspect(this.product.id)];
  }

  get displayRating(): string {
    if (this.ratingValue !== undefined) return this.ratingValue.toFixed(1);
    const n = (this.product.id.charCodeAt(0) % 14) / 10 + 3.6;
    return n.toFixed(1);
  }

  addToCart(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    if (this.product.stock <= 0) return;
    this.orders.addToCart(this.product.id, 1, this.product).subscribe({
      next: () => {
        this.cartState.refresh();
        this.snackBar.open('Ajouté au panier', this.product.name, { duration: 2000 });
      },
      error: () => this.snackBar.open('Impossible d\'ajouter au panier', 'OK', { duration: 2000 }),
    });
  }
}
