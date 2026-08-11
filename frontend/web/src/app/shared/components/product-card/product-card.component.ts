import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, MatIconModule, MatButtonModule],
  template: `
    <article class="product-card">
      <a [routerLink]="['/client/product', product.id]" class="card-link">
        <div class="image-wrap">
          @if (product.imageUrl) {
            <img [src]="product.imageUrl" [alt]="product.name" loading="lazy" />
          } @else {
            <div class="placeholder">
              <mat-icon>inventory_2</mat-icon>
            </div>
          }
          @if (product.compareAtPrice && product.compareAtPrice > product.price) {
            <span class="badge promo">Promo</span>
          }
        </div>
        <div class="info">
          @if (product.storeName) {
            <span class="store">{{ product.storeName }}</span>
          }
          <h3>{{ product.name }}</h3>
          <div class="price-row">
            <span class="price">{{ product.price | currency: product.currency:'symbol-narrow':'1.0-0' }}</span>
            @if (product.compareAtPrice && product.compareAtPrice > product.price) {
              <span class="compare">{{ product.compareAtPrice | currency: product.currency:'symbol-narrow':'1.0-0' }}</span>
            }
          </div>
          @if (product.stock <= 0) {
            <span class="stock out">Rupture</span>
          } @else if (product.stock < 5) {
            <span class="stock low">Plus que {{ product.stock }}</span>
          }
        </div>
      </a>
      @if (showFavorite) {
        <button mat-icon-button class="fav-btn" (click)="favoriteToggle.emit(product.id)" [attr.aria-label]="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'">
          <mat-icon>{{ isFavorite ? 'favorite' : 'favorite_border' }}</mat-icon>
        </button>
      }
    </article>
  `,
  styles: [`
    .product-card {
      position: relative;
      background: var(--surface);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      transition: box-shadow 0.2s;
    }
    .product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .card-link { display: block; text-decoration: none; color: inherit; }
    .image-wrap {
      aspect-ratio: 1;
      background: var(--surface-alt);
      position: relative;
      overflow: hidden;
    }
    img { width: 100%; height: 100%; object-fit: cover; }
    .placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted);
    }
    .placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .badge {
      position: absolute; top: 8px; left: 8px;
      padding: 2px 8px; border-radius: 4px;
      font-size: 0.6875rem; font-weight: 600;
    }
    .badge.promo { background: var(--accent); color: white; }
    .info { padding: 10px 12px 12px; }
    .store { font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    h3 {
      margin: 4px 0 6px;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .price-row { display: flex; align-items: baseline; gap: 6px; }
    .price { font-size: 1rem; font-weight: 700; color: var(--primary); }
    .compare { font-size: 0.75rem; color: var(--text-muted); text-decoration: line-through; }
    .stock { font-size: 0.6875rem; font-weight: 500; }
    .stock.out { color: var(--error); }
    .stock.low { color: var(--warning); }
    .fav-btn {
      position: absolute; top: 4px; right: 4px;
      background: rgba(255,255,255,0.9);
    }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() showFavorite = true;
  @Input() isFavorite = false;
  @Output() favoriteToggle = new EventEmitter<string>();
}
