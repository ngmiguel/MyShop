import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DEMO_STORES } from '../../../core/data/demo-stores';
import {
  DemoSellerProfile,
  getSellerByUserId,
  saveSellerProfile,
} from '../../../core/data/demo-sellers';
import { storeById } from '../../../core/utils/cart.util';
import { formatDate } from '../../../core/utils/format.util';
import { AppearanceSettingsComponent } from '../../../shared/components/appearance-settings/appearance-settings.component';
import { DataSettingsComponent } from '../../../shared/components/data-settings/data-settings.component';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    AppearanceSettingsComponent,
    DataSettingsComponent,
  ],
  template: `
    <div class="page">
      <header>
        <h1>Paramètres vendeur</h1>
        <p>Profil, rattachement, scanner, notifications et sécurité.</p>
      </header>

      @if (seller(); as s) {
        <section class="card">
          <div class="card-head">
            <h2>Profil</h2>
            <span class="badge" [class.pending]="s.status !== 'active'">
              {{ s.status === 'active' ? 'Actif' : 'En attente' }}
            </span>
          </div>
          <div class="grid-2">
            <label>Prénom<input [(ngModel)]="s.firstName" (ngModelChange)="patch({ firstName: $event })" /></label>
            <label>Nom<input [(ngModel)]="s.lastName" (ngModelChange)="patch({ lastName: $event })" /></label>
            <label>E-mail<input type="email" [(ngModel)]="s.email" (ngModelChange)="patch({ email: $event })" /></label>
            <label>Téléphone<input [(ngModel)]="s.phone" (ngModelChange)="patch({ phone: $event })" /></label>
            <label>Poste<input [(ngModel)]="s.position" (ngModelChange)="patch({ position: $event })" /></label>
            <label>Disponibilités<input [(ngModel)]="s.shift" (ngModelChange)="patch({ shift: $event })" /></label>
          </div>
          <p class="id-line">
            <mat-icon>verified_user</mat-icon>
            {{ s.idType }} n° {{ s.idNumber }} · membre depuis {{ formatDate(s.joinedAt) }}
          </p>
        </section>

        <section class="card">
          <h2>Boutique de rattachement</h2>
          <p class="desc">Actuellement : {{ storeName() }}</p>
          <div class="grid-2">
            <label>
              Nouvelle boutique
              <select [(ngModel)]="newStoreId">
                <option value="">Sélectionner…</option>
                @for (store of otherStores(); track store.id) {
                  <option [value]="store.id">{{ store.name }} — {{ store.city }}</option>
                }
              </select>
            </label>
            <label>
              Mot de passe de la boutique
              <input [(ngModel)]="newCode" placeholder="XXXX-0000" />
            </label>
          </div>
          <button mat-stroked-button type="button" (click)="changeStore()">
            <mat-icon>vpn_key</mat-icon>
            Changer de boutique
          </button>
        </section>

        <section class="card">
          <h2>Scanner</h2>
          <div class="toggle-list">
            <div class="toggle-row">
              <div><strong>Bip sonore à la lecture</strong></div>
              <mat-slide-toggle [checked]="theme.settings().scannerSound" (change)="theme.update({ scannerSound: $event.checked })" />
            </div>
            <div class="toggle-row">
              <div>
                <strong>Vibration à la lecture</strong>
                <p>Sur les appareils compatibles</p>
              </div>
              <mat-slide-toggle [checked]="theme.settings().scannerVibration" (change)="theme.update({ scannerVibration: $event.checked })" />
            </div>
            <div class="toggle-row">
              <div>
                <strong>Validation automatique</strong>
                <p>Confirme le retrait dès qu'un code valide est lu</p>
              </div>
              <mat-slide-toggle [checked]="theme.settings().scannerAutoConfirm" (change)="theme.update({ scannerAutoConfirm: $event.checked })" />
            </div>
            <div class="toggle-row">
              <div>
                <strong>Notifications de file</strong>
                <p>Alerte à chaque nouveau code en attente</p>
              </div>
              <mat-slide-toggle [checked]="theme.settings().queueNotifications" (change)="theme.update({ queueNotifications: $event.checked })" />
            </div>
          </div>
        </section>

        <app-appearance-settings />

        <app-data-settings />

        <section class="card">
          <h2>Sécurité & session</h2>
          <div class="actions">
            <button mat-stroked-button type="button" (click)="resetPassword()">
              <mat-icon>refresh</mat-icon>
              Réinitialiser mon mot de passe
            </button>
            <button mat-flat-button color="warn" type="button" (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              Fermer la session
            </button>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      padding: 20px;
    }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 600; }
    .card-head h2 { margin: 0; }
    .desc { margin: 0 0 16px; font-size: 14px; color: rgb(var(--muted)); }
    .badge {
      font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
      background: rgba(5,150,105,0.1); color: #059669;
    }
    .badge.pending { background: rgba(217,119,6,0.1); color: #d97706; }
    .grid-2 { display: grid; gap: 16px; margin-bottom: 16px; }
    @media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    label { display: block; font-size: 12px; font-weight: 600; color: rgb(var(--ink)); }
    input, select {
      width: 100%; margin-top: 6px; padding: 8px 12px; border-radius: 8px;
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); color: rgb(var(--ink));
    }
    .id-line {
      display: flex; align-items: center; gap: 8px; margin: 0;
      padding: 10px 12px; border-radius: 8px; background: rgb(var(--surface-2));
      font-size: 12px; color: rgb(var(--muted));
    }
    .id-line mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .toggle-list { display: flex; flex-direction: column; }
    .toggle-row {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
      padding: 14px 0; border-bottom: 1px solid rgb(var(--line));
    }
    .toggle-row:last-child { border-bottom: none; }
    .toggle-row strong { display: block; font-size: 14px; }
    .toggle-row p { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    button mat-icon { margin-right: 6px; }
  `],
})
export class SellerSettingsComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly snack = inject(MatSnackBar);

  readonly formatDate = formatDate;

  seller = signal<DemoSellerProfile | null>(null);
  storeName = signal('Boutique');
  newStoreId = '';
  newCode = '';

  otherStores = () => DEMO_STORES.filter((s) => s.id !== this.seller()?.storeId && s.isActive);

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user) return;
    const seller = getSellerByUserId(user.id);
    if (!seller) return;
    this.seller.set({ ...seller });
    this.storeName.set(storeById(seller.storeId)?.name ?? 'Boutique');
  }

  patch(p: Partial<DemoSellerProfile>): void {
    const current = this.seller();
    if (!current) return;
    const next = saveSellerProfile(current.id, p);
    if (next) this.seller.set({ ...next });
  }

  changeStore(): void {
    const current = this.seller();
    if (!current || !this.newStoreId) {
      this.snack.open('Sélectionnez une boutique', 'OK', { duration: 2500 });
      return;
    }
    const target = DEMO_STORES.find((s) => s.id === this.newStoreId);
    if (!target?.accessCode) return;
    if (this.newCode.trim().toUpperCase() !== target.accessCode.toUpperCase()) {
      this.snack.open('Mot de passe de boutique invalide', 'OK', { duration: 3000 });
      return;
    }
    const next = saveSellerProfile(current.id, { storeId: target.id, status: 'active' });
    if (next) {
      this.seller.set({ ...next });
      this.storeName.set(target.name);
      this.newStoreId = '';
      this.newCode = '';
      this.snack.open(`Rattaché à ${target.name}`, 'OK', { duration: 3000 });
    }
  }

  resetPassword(): void {
    this.snack.open('Lien de réinitialisation envoyé', 'OK', { duration: 3000 });
  }
}
