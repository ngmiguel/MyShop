import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CatalogService } from '../../../core/services/catalog.service';
import { CatalogImageService } from '../../../core/services/catalog-image.service';
import { StoreService } from '../../../core/services/store.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Product, Store } from '../../../core/models';
import { MatIconModule } from '@angular/material/icon';
import { STORE_INTERIOR_IMAGE } from '../../../core/data/images';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [MatIconModule, ProductCardComponent, LoadingSpinnerComponent],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (store()) {
      @let s = store()!;
      <div class="page">
        <button type="button" class="back" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Retour
        </button>

        <div class="hero-banner">
          <img [src]="s.coverUrl" [alt]="s.name" />
          <div class="hero-overlay">
            @if (s.logoUrl) {
              <img class="logo" [src]="s.logoUrl" alt="" />
            }
            <div>
              <h1>{{ s.name }}</h1>
              @if (s.city) {
                <p><mat-icon>location_on</mat-icon> {{ s.city }}</p>
              }
            </div>
          </div>
        </div>

        <div class="interior">
          <img [src]="interiorImage" alt="Intérieur boutique" />
        </div>

        @if (s.description) {
          <p class="desc">{{ s.description }}</p>
        }

        <h2 class="section-title">Produits de la boutique</h2>
        <div class="masonry">
          @for (product of products(); track product.id) {
            <app-product-card [product]="product" />
          } @empty {
            <p class="empty">Aucun produit dans cette boutique.</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .page { padding-bottom: 32px; }
    .back { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; color: rgb(var(--muted)); cursor: pointer; margin-bottom: 16px; }
    .hero-banner { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgb(var(--line)); margin-bottom: 16px; }
    .hero-banner > img { width: 100%; height: 200px; object-fit: cover; display: block; }
    @media (min-width: 640px) { .hero-banner > img { height: 280px; } }
    .hero-overlay {
      position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 16px;
      padding: 20px; background: linear-gradient(to top, rgba(15,23,42,0.75), transparent);
    }
    .logo { width: 56px; height: 56px; border-radius: 12px; border: 2px solid white; object-fit: cover; }
    .hero-overlay h1 { margin: 0; color: white; font-size: 1.5rem; font-weight: 600; }
    .hero-overlay p { margin: 4px 0 0; display: flex; align-items: center; gap: 4px; color: rgba(255,255,255,0.85); font-size: 14px; }
    .interior { border-radius: 12px; overflow: hidden; margin-bottom: 16px; border: 1px solid rgb(var(--line)); }
    .interior img { width: 100%; height: 160px; object-fit: cover; display: block; }
    .desc { font-size: 14px; color: rgb(var(--muted)); line-height: 1.6; margin-bottom: 24px; }
    .section-title { font-size: 1.125rem; font-weight: 600; margin: 0 0 16px; }
    .empty { text-align: center; color: rgb(var(--muted)); padding: 24px; }
  `],
})
export class StoreDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly storeService = inject(StoreService);
  private readonly catalog = inject(CatalogService);
  private readonly images = inject(CatalogImageService);

  readonly interiorImage = STORE_INTERIOR_IMAGE;

  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.storeService.getStore(id).subscribe({
      next: (s) => {
        this.store.set(this.images.enrichStore(s));
        this.loadProducts(id);
      },
      error: () => this.loading.set(false),
    });
  }

  goBack(): void {
    this.location.back();
  }

  private loadProducts(storeId: string): void {
    this.catalog.getProducts({ storeId, limit: 40 }).subscribe({
      next: (res) => {
        this.products.set(this.images.enrichProducts(res.data ?? []));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
