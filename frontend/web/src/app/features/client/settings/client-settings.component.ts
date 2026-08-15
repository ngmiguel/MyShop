import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { ThemeService } from '../../../core/services/theme.service';
import { CATEGORIES } from '../../../core/data/categories';
import { AppearanceSettingsComponent } from '../../../shared/components/appearance-settings/appearance-settings.component';

@Component({
  selector: 'app-client-settings',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatIconModule, MatSlideToggleModule, MatSnackBarModule,
    DecimalPipe, AppearanceSettingsComponent,
  ],
  template: `
    <div class="page">
      <header>
        <h1>Paramètres</h1>
        <p>Apparence, préférences du fil, localisation et données.</p>
      </header>

      <app-appearance-settings />

      <section class="card">
        <div class="card-head">
          <div>
            <h2>Préférences du fil</h2>
            <p>Ce qui influence l'onglet « Pour vous »</p>
          </div>
          <button type="button" class="btn-outline" (click)="restartOnboarding()">
            <mat-icon>replay</mat-icon> Rejouer le questionnaire
          </button>
        </div>
        <p class="label"><mat-icon>auto_awesome</mat-icon> Centres d'intérêt ({{ onboarding.state().categories.length }})</p>
        <div class="chips">
          @for (c of categories; track c.id) {
            <button type="button" class="chip" [class.active]="onboarding.state().categories.includes(c.id)" (click)="toggleCategory(c.id)">
              {{ c.label }}
            </button>
          }
        </div>
      </section>

      <section class="card">
        <h2>Localisation & budget</h2>
        <div class="grid-2">
          <div>
            <label>Ville de retrait</label>
            <input [(ngModel)]="city" (ngModelChange)="saveLocation()" />
          </div>
          <div>
            <label>Devise</label>
            <select [(ngModel)]="currency" (ngModelChange)="saveLocation()">
              <option value="XAF">Franc CFA</option>
              <option value="EUR">Euro</option>
              <option value="USD">Dollar</option>
            </select>
          </div>
        </div>
        <label>Rayon de recherche : {{ onboarding.state().radiusKm }} km</label>
        <input type="range" min="2" max="300" [ngModel]="onboarding.state().radiusKm" (ngModelChange)="setRadius($event)" />
        <label>Budget maximum par article : {{ onboarding.state().budgetMax | number:'1.0-0' }} FCFA</label>
        <input type="range" min="10000" max="10000000" step="10000" [ngModel]="onboarding.state().budgetMax" (ngModelChange)="setBudget($event)" />
        <label>Format de date</label>
        <select [ngModel]="theme.settings().dateFormat" (ngModelChange)="theme.update({ dateFormat: $event })">
          <option value="dd/MM/yyyy">31 déc. 2026</option>
          <option value="yyyy-MM-dd">2026-12-31</option>
        </select>
      </section>

      <section class="card">
        <h2>Notifications & favoris</h2>
        <div class="toggle-row">
          <div><strong>Notifications</strong><p>Codes QR, expiration, disponibilité</p></div>
          <mat-slide-toggle [checked]="onboarding.state().notifications" (change)="onboarding.update({ notifications: $event.checked })" />
        </div>
        <a routerLink="/client/favorites" class="btn-outline link-btn">
          <mat-icon>favorite</mat-icon> Gérer mes favoris
        </a>
      </section>

      @if (auth.user(); as user) {
        <section class="card">
          <h2>Compte connecté</h2>
          <p>{{ user.email }}</p>
          <button type="button" class="btn-warn" (click)="auth.logout()">Se déconnecter</button>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    header h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      padding: 20px;
    }
    .card h2 { margin: 0 0 4px; font-size: 1rem; font-weight: 600; }
    .card-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .card-head p { margin: 0; font-size: 13px; color: rgb(var(--muted)); }
    .label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgb(var(--muted)); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .chip { padding: 6px 14px; border-radius: 999px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); font-size: 12px; cursor: pointer; color: rgb(var(--muted)); }
    .chip.active { border-color: rgb(var(--accent)); background: rgba(var(--accent), 0.1); color: rgb(var(--accent)); }
    .grid-2 { display: grid; gap: 16px; margin: 16px 0; }
    @media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    label { display: block; margin-top: 12px; font-size: 12px; font-weight: 600; }
    input, select { width: 100%; margin-top: 6px; padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    input[type=range] { padding: 0; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgb(var(--line)); }
    .toggle-row p { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .btn-outline, .link-btn {
      display: inline-flex; align-items: center; gap: 8px; margin-top: 12px;
      padding: 8px 14px; border-radius: 999px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
      text-decoration: none; color: rgb(var(--ink)); cursor: pointer; font-size: 13px;
    }
    .btn-warn { margin-top: 12px; padding: 8px 14px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; }
  `],
})
export class ClientSettingsComponent {
  readonly auth = inject(AuthService);
  readonly onboarding = inject(OnboardingService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly categories = CATEGORIES;
  city = this.onboarding.state().city;
  currency = this.onboarding.state().currency;

  toggleCategory(id: string): void {
    const list = this.onboarding.state().categories;
    const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    this.onboarding.update({ categories: next });
  }

  saveLocation(): void {
    this.onboarding.update({ city: this.city, currency: this.currency });
  }

  setRadius(v: number): void {
    this.onboarding.update({ radiusKm: v });
  }

  setBudget(v: number): void {
    this.onboarding.update({ budgetMax: v });
  }

  restartOnboarding(): void {
    this.onboarding.reset();
    this.router.navigate(['/client/feed']);
    window.location.reload();
  }
}
