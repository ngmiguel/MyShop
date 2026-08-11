import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SellerService } from '../../../core/services/seller.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Seller } from '../../../core/models';

@Component({
  selector: 'app-manager-sellers',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule,
    PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="Vendeurs" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (sellers().length === 0) {
      <app-empty-state icon="badge" title="Aucun vendeur" message="Aucun vendeur enregistre." />
    } @else {
      <div class="sellers-list">
        @for (seller of sellers(); track seller.id) {
          <div class="seller-card">
            <div class="seller-info">
              <strong>{{ seller.firstName }} {{ seller.lastName }}</strong>
              <span>{{ seller.email }}</span>
              @if (seller.storeName) {
                <span class="store">{{ seller.storeName }}</span>
              }
            </div>
            <div class="seller-actions">
              <mat-chip [class]="seller.status">{{ statusLabel(seller.status) }}</mat-chip>
              @if (seller.status === 'pending') {
                <button mat-stroked-button (click)="approve(seller)">Approuver</button>
              } @else if (seller.status === 'active') {
                <button mat-stroked-button color="warn" (click)="suspend(seller)">Suspendre</button>
              } @else if (seller.status === 'suspended') {
                <button mat-stroked-button (click)="activate(seller)">Reactiver</button>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .sellers-list { padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; }
    .seller-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .seller-info strong { display: block; }
    .seller-info span { display: block; font-size: 0.8125rem; color: var(--text-muted); }
    .seller-actions { display: flex; align-items: center; gap: 8px; }
    mat-chip.pending { background: #fef3c7 !important; color: #92400e !important; }
    mat-chip.active { background: #d1fae5 !important; color: #065f46 !important; }
    mat-chip.suspended { background: #fee2e2 !important; color: #991b1b !important; }
  `],
})
export class ManagerSellersComponent implements OnInit {
  private readonly sellerService = inject(SellerService);
  private readonly snackBar = inject(MatSnackBar);

  sellers = signal<Seller[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadSellers();
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { pending: 'En attente', active: 'Actif', suspended: 'Suspendu' };
    return labels[status] ?? status;
  }

  approve(seller: Seller): void {
    this.sellerService.approve(seller.id).subscribe({
      next: () => { this.snackBar.open('Vendeur approuve', 'OK', { duration: 2000 }); this.loadSellers(); },
    });
  }

  suspend(seller: Seller): void {
    this.sellerService.suspend(seller.id).subscribe({
      next: () => { this.snackBar.open('Vendeur suspendu', 'OK', { duration: 2000 }); this.loadSellers(); },
    });
  }

  activate(seller: Seller): void {
    this.sellerService.activate(seller.id).subscribe({
      next: () => { this.snackBar.open('Vendeur reactive', 'OK', { duration: 2000 }); this.loadSellers(); },
    });
  }

  private loadSellers(): void {
    this.sellerService.getSellers().subscribe({
      next: (res) => { this.sellers.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
