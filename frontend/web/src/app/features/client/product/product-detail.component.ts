import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, Location } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CatalogService } from '../../../core/services/catalog.service';
import { CatalogImageService } from '../../../core/services/catalog-image.service';
import { OrderService } from '../../../core/services/order.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { UserService } from '../../../core/services/user.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { Product } from '../../../core/models';
import { categoryLabel, subcategoryLabel } from '../../../core/data/categories';
import {
  formatDetailDate,
  getProductMeta,
  ProductMeta,
  storeHoursToday,
  storeRating,
} from '../../../core/data/demo-product-meta';
import { DEMO_STORES, DEMO_STORE_COORDS } from '../../../core/data/demo-stores';
import { distanceKm, productRating, similarProducts } from '../../../core/utils/recommend.util';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CurrencyPipe, RouterLink, MatIconModule, MatSnackBarModule,
    LoadingSpinnerComponent, EmptyStateComponent, ProductCardComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner />
    } @else if (!product()) {
      <app-empty-state
        icon="inventory_2"
        title="Article introuvable"
        message="Cet article n'existe plus ou a été retiré par la boutique."
      >
        <button type="button" class="btn-primary" routerLink="/client/feed">Retour au catalogue</button>
      </app-empty-state>
    } @else {
      @let p = product()!;
      @let meta = productMeta()!;
      @let store = storeInfo();
      <div class="page">
        <button type="button" class="back" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Retour
        </button>

        <div class="hero-grid">
          <div class="gallery">
            <div class="hero">
              <img [src]="gallery()[imageIndex()]" [alt]="p.name" referrerpolicy="no-referrer" />
            </div>
            <div class="thumbs">
              @for (src of gallery(); track src; let i = $index) {
                <button type="button" class="thumb" [class.active]="imageIndex() === i" (click)="imageIndex.set(i)">
                  <img [src]="src" alt="" referrerpolicy="no-referrer" />
                </button>
              }
            </div>
          </div>

          <div class="info">
            <div class="tags">
              @if (p.categoryId) {
                <span class="tag accent">{{ categoryLabel(p.categoryId) }}</span>
              }
              @if (p.subcategoryId) {
                <span class="tag">{{ subcategoryLabel(p.subcategoryId) }}</span>
              }
              @if (p.stock > 0) {
                <span class="tag ok">{{ p.stock }} en stock</span>
              } @else {
                <span class="tag warn">Rupture</span>
              }
            </div>

            <h1>{{ p.name }}</h1>

            <div class="rating-row">
              @for (s of [1,2,3,4,5]; track s) {
                <mat-icon class="star" [class.filled]="s <= Math.round(meta.rating)">star</mat-icon>
              }
              <span>{{ meta.rating.toFixed(1) }}</span>
              <span class="muted">({{ meta.reviewCount }} avis)</span>
            </div>

            <div class="price-block">
              <span class="price">{{ p.price | currency: p.currency:'symbol-narrow':'1.0-0' }}</span>
              @if (p.compareAtPrice && p.compareAtPrice > p.price) {
                <span class="compare">{{ p.compareAtPrice | currency: p.currency:'symbol-narrow':'1.0-0' }}</span>
              }
            </div>

            @if (p.description) {
              <p class="description">{{ p.description }}</p>
            }

            <div class="actions">
              <div class="qty-stepper">
                <button type="button" (click)="qty.set(Math.max(1, qty() - 1))" aria-label="Diminuer">−</button>
                <span>{{ qty() }}</span>
                <button type="button" (click)="qty.set(qty() + 1)" aria-label="Augmenter">+</button>
              </div>
              <button type="button" class="btn-primary" [disabled]="p.stock <= 0 || adding()" (click)="addToCart()">
                <mat-icon>shopping_bag</mat-icon> Ajouter au panier
              </button>
              <button type="button" class="btn-outline" (click)="toggleFavorite()">
                <mat-icon [class.fav-on]="isFavorite">{{ isFavorite ? 'favorite' : 'favorite_border' }}</mat-icon>
                {{ isFavorite ? 'Favori' : 'Enregistrer' }}
              </button>
            </div>

            @if (store) {
              <div class="store-card card">
                <div class="store-head">
                  <div>
                    <p class="store-name">
                      <mat-icon>storefront</mat-icon> {{ store.name }}
                    </p>
                    <p class="store-meta">
                      <mat-icon>location_on</mat-icon>
                      {{ store.address }}, {{ store.city }}
                      @if (distance() !== null) { · {{ distance() }} km }
                    </p>
                    <p class="store-meta">
                      <mat-icon>schedule</mat-icon>
                      @if (hours().closed) {
                        Fermé aujourd'hui
                      } @else {
                        Aujourd'hui {{ hours().open }} – {{ hours().close }}
                      }
                    </p>
                    <div class="store-rating">
                      @for (s of [1,2,3,4,5]; track s) {
                        <mat-icon class="star sm" [class.filled]="s <= Math.round(storeRate().rating)">star</mat-icon>
                      }
                      <span class="muted">({{ storeRate().reviewCount }})</span>
                    </div>
                  </div>
                  <a [routerLink]="['/client/store', store.id]" class="store-link-btn">Voir la boutique</a>
                </div>
                <p class="pickup-note">
                  <mat-icon>verified_user</mat-icon>
                  Paiement en ligne puis retrait sur place : votre code QR est validé par un vendeur de la boutique.
                </p>
              </div>
            }
          </div>
        </div>

        <div class="details-grid">
          <section class="card detail-card">
            <h2>Caractéristiques</h2>
            <dl>
              @for (entry of specEntries(meta); track entry.key) {
                <div class="spec-row">
                  <dt>{{ entry.key }}</dt>
                  <dd>{{ entry.value }}</dd>
                </div>
              }
              <div class="spec-row">
                <dt>Mis en ligne</dt>
                <dd>{{ formatDetailDate(meta.createdAt) }}</dd>
              </div>
              <div class="spec-row">
                <dt>Vues</dt>
                <dd>{{ meta.views }}</dd>
              </div>
            </dl>
          </section>

          <section class="card detail-card">
            <h2>Avis clients ({{ meta.reviews.length }})</h2>
            <ul class="reviews">
              @for (review of meta.reviews; track review.id) {
                <li>
                  <div class="review-head">
                    <strong>{{ review.author }}</strong>
                    <span class="review-stars">
                      @for (s of [1,2,3,4,5]; track s) {
                        <mat-icon class="star sm" [class.filled]="s <= review.rating">star</mat-icon>
                      }
                    </span>
                  </div>
                  <p class="review-text">{{ review.comment }}</p>
                  <span class="review-date">{{ formatDetailDate(review.date) }}</span>
                </li>
              }
            </ul>
          </section>

          @if (mapEmbedUrl()) {
            <section class="card detail-card map-card">
              <h2>Localisation du retrait</h2>
              <iframe [src]="mapEmbedUrl()!" title="Carte de retrait" loading="lazy"></iframe>
            </section>
          }
        </div>

        @if (similar().length) {
          <section class="similar">
            <h2>Articles similaires</h2>
            <div class="masonry wide">
              @for (item of similar(); track item.product.id) {
                <app-product-card
                  [product]="item.product"
                  [distance]="item.distance"
                  [ratingValue]="item.rating"
                  [isFavorite]="userService.isFavorite(item.product.id)"
                  (favoriteToggle)="userService.toggleFavorite($event)"
                />
              }
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 32px; padding-bottom: 32px; }
    .back { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; color: rgb(var(--muted)); cursor: pointer; font-size: 14px; padding: 0; }
    .back:hover { color: rgb(var(--ink)); }
    .hero-grid { display: grid; gap: 32px; }
    @media (min-width: 1024px) { .hero-grid { grid-template-columns: 1fr 1fr; } }
    .hero { overflow: hidden; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .hero img { width: 100%; height: 380px; object-fit: cover; display: block; }
    .thumbs { display: flex; gap: 8px; margin-top: 12px; overflow-x: auto; }
    .thumb { flex-shrink: 0; width: 80px; height: 64px; border-radius: 8px; overflow: hidden; border: 2px solid rgb(var(--line)); padding: 0; cursor: pointer; background: none; }
    .thumb.active, .thumb:hover { border-color: rgb(var(--accent)); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .tag { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; background: rgb(var(--surface-2)); color: rgb(var(--muted)); border: 1px solid rgb(var(--line)); }
    .tag.accent { background: rgba(var(--accent), 0.1); color: rgb(var(--accent)); border-color: rgba(var(--accent), 0.3); }
    .tag.ok { background: rgba(5,150,105,0.1); color: #059669; }
    .tag.warn { background: rgba(220,38,38,0.1); color: #dc2626; }
    h1 { margin: 0 0 8px; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .rating-row { display: flex; align-items: center; gap: 4px; margin-bottom: 16px; font-size: 14px; }
    .star { font-size: 16px; width: 16px; height: 16px; color: #d1d5db; }
    .star.sm { font-size: 14px; width: 14px; height: 14px; }
    .star.filled { color: #fbbf24; }
    .muted { color: rgb(var(--muted)); font-size: 13px; margin-left: 4px; }
    .price-block { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
    .price { font-size: 1.875rem; font-weight: 600; }
    .compare { font-size: 1rem; color: rgb(var(--muted)); text-decoration: line-through; }
    .description { font-size: 14px; line-height: 1.65; color: rgb(var(--muted)); margin: 0 0 20px; }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 24px; }
    .qty-stepper { display: inline-flex; align-items: center; border: 1px solid rgb(var(--line)); border-radius: 8px; }
    .qty-stepper button { border: none; background: none; padding: 8px 14px; cursor: pointer; color: rgb(var(--muted)); font-size: 18px; }
    .qty-stepper span { min-width: 40px; text-align: center; font-size: 14px; font-weight: 500; }
    .btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; background: rgb(var(--accent)); color: white; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { display: inline-flex; align-items: center; gap: 8px; padding: 12px 16px; border: 1px solid rgb(var(--line)); border-radius: 8px; background: rgb(var(--surface)); cursor: pointer; }
    .btn-outline mat-icon.fav-on { color: #f43f5e; }
    .store-card { padding: 16px; }
    .store-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .store-name { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; font-weight: 600; }
    .store-name mat-icon { color: rgb(var(--accent)); font-size: 18px; width: 18px; height: 18px; }
    .store-meta { display: flex; align-items: center; gap: 6px; margin: 6px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .store-meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .store-rating { display: flex; align-items: center; gap: 2px; margin-top: 8px; }
    .store-link-btn { flex-shrink: 0; padding: 6px 12px; border-radius: 8px; border: 1px solid rgb(var(--line)); font-size: 12px; font-weight: 500; color: rgb(var(--ink)); text-decoration: none; }
    .store-link-btn:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .pickup-note { display: flex; align-items: flex-start; gap: 8px; margin: 12px 0 0; padding: 10px 12px; border-radius: 8px; background: rgb(var(--surface-2)); font-size: 12px; color: rgb(var(--muted)); }
    .pickup-note mat-icon { color: rgb(var(--accent)); font-size: 16px; width: 16px; height: 16px; }
    .details-grid { display: grid; gap: 24px; }
    @media (min-width: 1024px) { .details-grid { grid-template-columns: repeat(3, 1fr); } }
    .detail-card { padding: 16px; }
    .detail-card h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; }
    .spec-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgb(var(--line)); font-size: 14px; }
    .spec-row:last-child { border-bottom: none; }
    .spec-row dt { color: rgb(var(--muted)); }
    .spec-row dd { margin: 0; font-weight: 500; text-align: right; }
    .reviews { list-style: none; margin: 0; padding: 0; }
    .reviews li { padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid rgb(var(--line)); }
    .reviews li:last-child { border-bottom: none; margin-bottom: 0; }
    .review-head { display: flex; justify-content: space-between; align-items: center; }
    .review-stars { display: flex; }
    .review-text { margin: 6px 0 4px; font-size: 14px; color: rgb(var(--muted)); line-height: 1.5; }
    .review-date { font-size: 12px; color: rgb(var(--muted)); }
    .map-card iframe { width: 100%; height: 280px; border: none; border-radius: 8px; }
    .similar h2 { margin: 0 0 16px; font-size: 1.125rem; font-weight: 600; }
  `],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly catalog = inject(CatalogService);
  private readonly images = inject(CatalogImageService);
  private readonly orderService = inject(OrderService);
  private readonly cartState = inject(CartStateService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly userService = inject(UserService);
  private readonly onboarding = inject(OnboardingService);
  private readonly snackBar = inject(MatSnackBar);

  readonly Math = Math;
  readonly categoryLabel = categoryLabel;
  readonly subcategoryLabel = subcategoryLabel;
  readonly formatDetailDate = formatDetailDate;

  product = signal<Product | null>(null);
  productMeta = signal<ProductMeta | null>(null);
  gallery = signal<string[]>([]);
  imageIndex = signal(0);
  qty = signal(1);
  loading = signal(true);
  adding = signal(false);
  isFavorite = false;
  allProducts = signal<Product[]>([]);

  storeInfo = computed(() => {
    const p = this.product();
    if (!p) return null;
    return DEMO_STORES.find((s) => s.id === p.storeId) ?? {
      id: p.storeId,
      name: p.storeName ?? 'Boutique',
      address: 'Centre-ville',
      city: 'Douala',
      isActive: true,
    };
  });

  distance = computed(() => {
    const p = this.product();
    if (!p) return null;
    const prefs = this.onboarding.state();
    return distanceKm({ lat: prefs.lat, lng: prefs.lng }, p.storeId);
  });

  hours = computed(() => storeHoursToday());
  storeRate = computed(() => storeRating(this.product()?.storeId ?? ''));

  mapEmbedUrl = computed((): SafeResourceUrl | null => {
    const p = this.product();
    if (!p) return null;
    const coords = DEMO_STORE_COORDS[p.storeId];
    if (!coords) return null;
    const { lat, lng } = coords;
    const d = 0.02;
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  similar = computed(() => {
    const p = this.product();
    if (!p) return [];
    const prefs = this.onboarding.state();
    return similarProducts(p, this.allProducts()).map((product) => ({
      product,
      distance: distanceKm({ lat: prefs.lat, lng: prefs.lng }, product.storeId),
      rating: productRating(product),
    }));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.catalog.getProducts({ limit: 200 }).subscribe({
      next: (res) => this.allProducts.set(this.images.enrichProducts(res.data ?? [])),
    });
    this.catalog.getProduct(id).subscribe({
      next: (p) => {
        const enriched = this.images.enrichProduct(p);
        this.product.set(enriched);
        this.productMeta.set(getProductMeta(enriched));
        this.gallery.set(enriched.gallery?.length ? enriched.gallery : this.images.productGallery(enriched));
        this.isFavorite = this.userService.isFavorite(p.id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  specEntries(meta: ProductMeta): Array<{ key: string; value: string }> {
    return Object.entries(meta.specs).map(([key, value]) => ({ key, value }));
  }

  goBack(): void {
    this.location.back();
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
    this.orderService.addToCart(p.id, this.qty(), p).subscribe({
      next: () => {
        this.cartState.refresh();
        this.snackBar.open(`Ajouté au panier · ${this.qty()} × ${p.name}`, 'OK', { duration: 2500 });
        this.adding.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'ajout', 'OK', { duration: 2500 });
        this.adding.set(false);
      },
    });
  }
}
