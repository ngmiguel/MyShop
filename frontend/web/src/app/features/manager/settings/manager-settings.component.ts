import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { OrderService } from '../../../core/services/order.service';
import { ThemeService } from '../../../core/services/theme.service';
import { formatDate } from '../../../core/utils/format.util';
import { AppearanceSettingsComponent } from '../../../shared/components/appearance-settings/appearance-settings.component';

@Component({
  selector: 'app-manager-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    AppearanceSettingsComponent,
  ],
  template: `
    <div class="page">
      <header>
        <h1>Paramètres de l'enseigne</h1>
        <p>Profil, politiques par défaut, sécurité des codes, seuils de monitoring et exports.</p>
      </header>

      <section class="card">
        <h2>Profil enseigne</h2>
        <div class="grid-2">
          <label>Nom affiché<input [(ngModel)]="managerName" /></label>
          <label>E-mail<input type="email" [(ngModel)]="managerEmail" /></label>
        </div>
        <p class="meta">{{ storeCount() }} boutiques · {{ sellerCount() }} vendeurs · {{ orderCount() }} commandes enregistrées</p>
      </section>

      <section class="card">
        <h2>Politiques par défaut des boutiques</h2>
        <div class="grid-2">
          <label>Taux de taxe par défaut (%)
            <input type="number" step="0.01" [ngModel]="theme.settings().defaultTaxRate" (ngModelChange)="theme.update({ defaultTaxRate: +$event })" />
          </label>
          <label>Longueur du mot de passe boutique
            <input type="number" min="6" max="16" [ngModel]="theme.settings().accessCodeLength" (ngModelChange)="theme.update({ accessCodeLength: +$event })" />
          </label>
          <label>Expiration des codes QR (heures)
            <input type="number" [ngModel]="theme.settings().qrExpiryHours" (ngModelChange)="theme.update({ qrExpiryHours: +$event })" />
          </label>
          <label>Rafraîchissement des modèles (heures)
            <input type="number" [ngModel]="theme.settings().modelRefreshHours" (ngModelChange)="theme.update({ modelRefreshHours: +$event })" />
          </label>
        </div>
      </section>

      <section class="card">
        <h2>Mots de passe des boutiques</h2>
        <ul class="store-list">
          @for (store of stores(); track store.id) {
            <li>
              <div>
                <strong>{{ store.name }}</strong>
                <span>Expire le {{ formatDate(store.accessCodeExpiry) }} · {{ store.autoApproveSellers ? 'validation automatique' : 'validation manuelle' }}</span>
              </div>
              <code>{{ store.accessCode }}</code>
              <mat-slide-toggle
                [checked]="store.autoApproveSellers"
                (change)="updateAutoApprove(store.id, $event.checked)"
              >Auto</mat-slide-toggle>
              <button type="button" mat-stroked-button (click)="regenerate(store.id, store.name)">
                <mat-icon>vpn_key</mat-icon> Régénérer
              </button>
            </li>
          }
        </ul>
      </section>

      <section class="card">
        <h2>Seuils de monitoring</h2>
        <div class="grid-2">
          <label>Latence max (ms)
            <input type="number" [ngModel]="theme.settings().alertLatencyMs" (ngModelChange)="theme.update({ alertLatencyMs: +$event })" />
          </label>
          <label>Taux d'erreur max (%)
            <input type="number" step="0.1" [ngModel]="theme.settings().alertErrorRate" (ngModelChange)="theme.update({ alertErrorRate: +$event })" />
          </label>
        </div>
      </section>

      <app-appearance-settings />

      <section class="card">
        <h2>Exports & session</h2>
        <div class="actions">
          <button mat-stroked-button type="button" (click)="exportAudit()">
            <mat-icon>download</mat-icon> Journal d'audit CSV
          </button>
          <button mat-flat-button color="warn" type="button" (click)="auth.logout()">
            <mat-icon>logout</mat-icon> Fermer la session
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .card { background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 12px; padding: 20px; }
    h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; }
    .grid-2 { display: grid; gap: 16px; }
    @media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    label { display: block; font-size: 12px; font-weight: 600; }
    input { width: 100%; margin-top: 6px; padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .meta { margin: 12px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .store-list { list-style: none; margin: 0; padding: 0; }
    .store-list li {
      display: flex; flex-wrap: wrap; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid rgb(var(--line));
    }
    .store-list li:last-child { border-bottom: none; }
    .store-list strong { display: block; font-size: 14px; }
    .store-list span { display: block; font-size: 12px; color: rgb(var(--muted)); }
    code { padding: 4px 8px; border-radius: 6px; background: rgb(var(--surface-2)); font-family: monospace; font-size: 12px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button mat-icon { margin-right: 6px; }
  `],
})
export class ManagerSettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly data = inject(ManagerDataService);
  private readonly orders = inject(OrderService);
  private readonly snack = inject(MatSnackBar);

  readonly formatDate = formatDate;

  managerName = 'Manager Boutika';
  managerEmail = 'manager@myshop.app';
  stores = signal(this.data.getManagerStores());
  storeCount = signal(0);
  sellerCount = signal(0);
  orderCount = signal(0);

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.managerName = `${user.firstName ?? 'Manager'} ${user.lastName ?? 'Boutika'}`.trim();
      this.managerEmail = user.email;
    }
    this.storeCount.set(this.data.getManagerStores().length);
    this.sellerCount.set(this.data.getSellers().length);
    this.orders.getOrders().subscribe({
      next: (res) => this.orderCount.set(res.total ?? (res.data?.length ?? 0)),
    });
  }

  updateAutoApprove(storeId: string, value: boolean): void {
    this.data.updateStore(storeId, { autoApproveSellers: value });
    this.stores.set(this.data.getManagerStores());
  }

  regenerate(storeId: string, name: string): void {
    const code = this.data.regenerateAccessCode(storeId, this.theme.settings().accessCodeLength);
    this.stores.set(this.data.getManagerStores());
    this.snack.open(`Nouveau code pour ${name}`, code, { duration: 4000 });
  }

  exportAudit(): void {
    this.orders.getOrders().subscribe({
      next: (res) => {
        const rows = [['Horodatage', 'Objet', 'Détail'], ...(res.data ?? []).slice(0, 80).map((o) => [
          o.createdAt,
          `Commande ${o.reference ?? o.orderNumber}`,
          `${o.storeName ?? o.storeId} · ${o.status}`,
        ])];
        const blob = new Blob([rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal-audit-boutika.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.snack.open("Journal d'audit exporté", 'OK', { duration: 2500 });
      },
    });
  }
}
