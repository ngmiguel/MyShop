import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreService } from '../../../core/services/store.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { Store } from '../../../core/models';

@Component({
  selector: 'app-manager-stores',
  standalone: true,
  imports: [
    MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule,
    PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent,
  ],
  template: `
    <app-page-header title="Boutiques" />

    @if (loading()) {
      <app-loading-spinner />
    } @else if (stores().length === 0) {
      <app-empty-state icon="store" title="Aucune boutique" message="Aucune boutique enregistree." />
    } @else {
      <div class="stores-list">
        @for (store of stores(); track store.id) {
          <div class="store-card">
            <div class="store-info">
              <strong>{{ store.name }}</strong>
              @if (store.city) {
                <span><mat-icon>location_on</mat-icon> {{ store.city }}</span>
              }
              <div class="meta">
                <span>{{ store.productCount ?? 0 }} produits</span>
                <span>{{ store.sellerCount ?? 0 }} vendeurs</span>
              </div>
            </div>
            <div class="store-actions">
              <mat-chip [class.active]="store.isActive">{{ store.isActive ? 'Active' : 'Inactive' }}</mat-chip>
              <button mat-icon-button (click)="regenerateCode(store)" matTooltip="Regenerer le code">
                <mat-icon>vpn_key</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .stores-list { padding: 16px 24px; display: flex; flex-direction: column; gap: 10px; }
    .store-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .store-info strong { display: block; font-size: 1rem; margin-bottom: 4px; }
    .store-info span { display: flex; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--text-muted); }
    .store-info span mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .meta { display: flex; gap: 12px; margin-top: 6px; font-size: 0.75rem; }
    .store-actions { display: flex; align-items: center; gap: 8px; }
    mat-chip.active { background: #d1fae5 !important; color: #065f46 !important; }
  `],
})
export class ManagerStoresComponent implements OnInit {
  private readonly storeService = inject(StoreService);
  private readonly snackBar = inject(MatSnackBar);

  stores = signal<Store[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.storeService.getStores({ limit: 50 }).subscribe({
      next: (res) => { this.stores.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  regenerateCode(store: Store): void {
    this.storeService.regenerateAccessCode(store.id).subscribe({
      next: () => this.snackBar.open('Code regenere', 'OK', { duration: 2000 }),
      error: () => this.snackBar.open('Erreur', 'Fermer', { duration: 3000 }),
    });
  }
}
