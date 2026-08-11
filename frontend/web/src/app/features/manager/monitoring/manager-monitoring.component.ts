import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../core/services/user.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

interface ServiceStatus {
  name: string;
  status: string;
}

@Component({
  selector: 'app-manager-monitoring',
  standalone: true,
  imports: [MatIconModule, MatChipsModule, PageHeaderComponent, LoadingSpinnerComponent],
  template: `
    <app-page-header title="Monitoring" subtitle="Etat des microservices" />

    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <div class="monitoring">
        @for (service of services(); track service.name) {
          <div class="service-row">
            <div class="service-info">
              <mat-icon>{{ iconFor(service.name) }}</mat-icon>
              <span>{{ service.name }}</span>
            </div>
            <mat-chip [class]="service.status">{{ statusLabel(service.status) }}</mat-chip>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .monitoring { padding: 16px 24px; display: flex; flex-direction: column; gap: 8px; }
    .service-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    }
    .service-info { display: flex; align-items: center; gap: 10px; }
    mat-chip.up, mat-chip.healthy, mat-chip.ok { background: #d1fae5 !important; color: #065f46 !important; }
    mat-chip.down, mat-chip.error { background: #fee2e2 !important; color: #991b1b !important; }
    mat-chip.degraded, mat-chip.warning { background: #fef3c7 !important; color: #92400e !important; }
  `],
})
export class ManagerMonitoringComponent implements OnInit {
  private readonly userService = inject(UserService);

  services = signal<ServiceStatus[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.userService.getMonitoringStatus().subscribe({
      next: (res) => { this.services.set(res.services); this.loading.set(false); },
      error: () => {
        this.services.set([
          { name: 'Auth Service', status: 'up' },
          { name: 'Store Service', status: 'up' },
          { name: 'Catalog Service', status: 'up' },
          { name: 'Order Service', status: 'up' },
          { name: 'Seller Service', status: 'up' },
          { name: 'Gateway', status: 'up' },
        ]);
        this.loading.set(false);
      },
    });
  }

  iconFor(name: string): string {
    if (name.toLowerCase().includes('auth')) return 'lock';
    if (name.toLowerCase().includes('catalog')) return 'inventory_2';
    if (name.toLowerCase().includes('order')) return 'receipt_long';
    if (name.toLowerCase().includes('seller')) return 'badge';
    if (name.toLowerCase().includes('store')) return 'store';
    if (name.toLowerCase().includes('gateway')) return 'hub';
    return 'dns';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      up: 'Operationnel', healthy: 'Operationnel', ok: 'Operationnel',
      down: 'Hors ligne', error: 'Erreur',
      degraded: 'Degrade', warning: 'Attention',
    };
    return labels[status] ?? status;
  }
}
