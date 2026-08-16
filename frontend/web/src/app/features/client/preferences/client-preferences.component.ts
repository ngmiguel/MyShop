import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CATEGORIES, CITIES } from '../../../core/data/categories';
import { OnboardingService, OnboardingState } from '../../../core/services/onboarding.service';

const INTENTS: Array<{ id: OnboardingState['intention']; label: string; icon: string; description: string }> = [
  { id: 'buy', label: 'Acheter maintenant', icon: 'shopping_bag', description: 'Priorité stock et proximité' },
  { id: 'compare', label: 'Comparer', icon: 'balance', description: 'Priorité prix et avis' },
  { id: 'browse', label: "S'inspirer", icon: 'auto_awesome', description: 'Découverte et nouveautés' },
];

const MODES: Array<{ id: OnboardingState['preferredMode']; label: string }> = [
  { id: 'any', label: 'Peu importe' },
  { id: 'pickup', label: 'Retrait en boutique' },
  { id: 'delivery', label: 'Livraison' },
];

@Component({
  selector: 'app-client-preferences',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    DecimalPipe,
  ],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <p class="eyebrow">Personnalisation</p>
          <h1>Mes préférences</h1>
          <p>Ce qui alimente votre fil « Pour vous » et vos suggestions.</p>
        </div>
        <a routerLink="/client/settings" class="btn-outline">
          <mat-icon>settings</mat-icon> Paramètres
        </a>
      </header>

      <section class="card">
        <h2>Mon intention</h2>
        <div class="intent-grid">
          @for (item of intents; track item.id) {
            <button
              type="button"
              class="intent"
              [class.active]="draft().intention === item.id"
              (click)="patch({ intention: item.id })"
            >
              <mat-icon>{{ item.icon }}</mat-icon>
              <strong>{{ item.label }}</strong>
              <span>{{ item.description }}</span>
            </button>
          }
        </div>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>Mes univers ({{ draft().categories.length }}/{{ categories.length }})</h2>
          <button type="button" class="text-btn" (click)="clearUniverses()">Tout retirer</button>
        </div>
        <p class="hint">Choisissez au moins 3 familles pour un fil pertinent.</p>
        <div class="cat-grid">
          @for (c of categories; track c.id) {
            <button
              type="button"
              class="cat"
              [class.active]="draft().categories.includes(c.id)"
              (click)="toggleCategory(c.id)"
            >
              <span class="dot" [style.background]="c.color"></span>
              {{ c.label }}
              @if (draft().categories.includes(c.id)) {
                <mat-icon>check</mat-icon>
              }
            </button>
          }
        </div>
      </section>

      @if (selectedCategories().length) {
        <section class="card">
          <h2>Mes rayons ({{ draft().subcategories.length }})</h2>
          @for (c of selectedCategories(); track c.id) {
            <p class="sub-head">{{ c.label }}</p>
            <div class="chips">
              @for (s of c.subcategories; track s.id) {
                <button
                  type="button"
                  class="chip"
                  [class.active]="draft().subcategories.includes(s.id)"
                  (click)="toggleSub(s.id)"
                >
                  {{ s.label }}
                </button>
              }
            </div>
          }
        </section>
      }

      <section class="card">
        <h2>Budget &amp; zone</h2>
        <div class="grid-2">
          <div>
            <label>Budget max. par article</label>
            <p class="value">{{ draft().budgetMax | number:'1.0-0' }} FCFA</p>
            <input
              type="range"
              min="10000"
              max="10000000"
              step="10000"
              [ngModel]="draft().budgetMax"
              (ngModelChange)="patch({ budgetMax: $event })"
            />
          </div>
          <div>
            <label>Ville de retrait</label>
            <select [ngModel]="draft().city" (ngModelChange)="setCity($event)">
              @for (c of cities; track c.name) {
                <option [value]="c.name">{{ c.name }}</option>
              }
            </select>
          </div>
        </div>
        <label>Rayon de recherche : {{ draft().radiusKm }} km</label>
        <input
          type="range"
          min="2"
          max="120"
          [ngModel]="draft().radiusKm"
          (ngModelChange)="patch({ radiusKm: $event })"
        />
        <label>Mode préféré</label>
        <div class="chips">
          @for (m of modes; track m.id) {
            <button
              type="button"
              class="chip"
              [class.active]="draft().preferredMode === m.id"
              (click)="patch({ preferredMode: m.id })"
            >
              {{ m.label }}
            </button>
          }
        </div>
        <div class="toggles">
          <div class="toggle-row">
            <div>
              <strong>Mettre les promotions en avant</strong>
              <p>Priorise les articles en réduction dans le fil</p>
            </div>
            <mat-slide-toggle
              [checked]="draft().promosOnly"
              (change)="patch({ promosOnly: $event.checked })"
            />
          </div>
          <div class="toggle-row">
            <div>
              <strong>Privilégier ma ville</strong>
              <p>Favorise les boutiques proches de {{ draft().city }}</p>
            </div>
            <mat-slide-toggle
              [checked]="draft().localOnly"
              (change)="patch({ localOnly: $event.checked })"
            />
          </div>
        </div>
      </section>

      <div class="footer-bar">
        <button type="button" class="btn-outline" (click)="restartOnboarding()">
          <mat-icon>replay</mat-icon>
          Refaire le questionnaire
        </button>
        <button
          type="button"
          class="btn-primary"
          [disabled]="draft().categories.length < 3"
          (click)="save()"
        >
          Enregistrer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 52rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 96px;
    }
    .page-head {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .eyebrow {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 700;
      color: rgb(var(--accent));
    }
    h1 { margin: 4px 0 0; font-size: 1.5rem; font-weight: 700; }
    .page-head > div > p:last-child {
      margin: 4px 0 0;
      color: rgb(var(--muted));
      font-size: 0.9rem;
    }
    .card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 14px;
      padding: 20px;
    }
    .card h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 700; }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }
    .card-head h2 { margin: 0; }
    .hint { margin: 0 0 12px; font-size: 0.85rem; color: rgb(var(--muted)); }
    .text-btn {
      border: none;
      background: transparent;
      color: rgb(var(--accent));
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .intent-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .intent {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      text-align: left;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      cursor: pointer;
    }
    .intent.active {
      border-color: rgb(var(--accent));
      background: rgb(var(--accent) / 0.08);
    }
    .intent strong { font-size: 0.9rem; }
    .intent span { font-size: 0.75rem; color: rgb(var(--muted)); }
    .intent mat-icon { color: rgb(var(--accent)); }
    .cat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
    }
    .cat {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      text-align: left;
    }
    .cat.active {
      border-color: rgb(var(--accent));
      background: rgb(var(--accent) / 0.08);
      color: rgb(var(--accent));
    }
    .cat mat-icon { margin-left: auto; font-size: 16px; width: 16px; height: 16px; }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex-shrink: 0;
    }
    .sub-head {
      margin: 12px 0 8px;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 700;
      color: rgb(var(--muted));
    }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .grid-2 {
      display: grid;
      gap: 16px;
      margin-bottom: 8px;
    }
    @media (min-width: 720px) {
      .grid-2 { grid-template-columns: 1fr 1fr; }
    }
    label {
      display: block;
      margin-top: 12px;
      font-size: 12px;
      font-weight: 700;
      color: rgb(var(--muted));
    }
    .value { margin: 4px 0; font-weight: 700; }
    input[type=range], select {
      width: 100%;
      margin-top: 6px;
    }
    select {
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
    }
    .toggles { margin-top: 16px; }
    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 0;
      border-top: 1px solid rgb(var(--line));
    }
    .toggle-row p {
      margin: 4px 0 0;
      font-size: 0.8rem;
      color: rgb(var(--muted));
    }
    .footer-bar {
      position: sticky;
      bottom: 12px;
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border-radius: 14px;
      background: rgb(var(--surface) / 0.92);
      border: 1px solid rgb(var(--line));
      backdrop-filter: blur(10px);
    }
    @media (max-width: 720px) {
      .intent-grid { grid-template-columns: 1fr; }
      .footer-bar { flex-direction: column; }
    }
  `],
})
export class ClientPreferencesComponent {
  private readonly onboarding = inject(OnboardingService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly categories = CATEGORIES;
  readonly cities = CITIES;
  readonly intents = INTENTS;
  readonly modes = MODES;

  readonly draft = signal<OnboardingState>({ ...this.onboarding.state() });

  readonly selectedCategories = computed(() =>
    CATEGORIES.filter((c) => this.draft().categories.includes(c.id)),
  );

  patch(partial: Partial<OnboardingState>): void {
    this.draft.update((d) => ({ ...d, ...partial }));
  }

  toggleCategory(id: string): void {
    const current = this.draft();
    const active = current.categories.includes(id);
    const categories = active
      ? current.categories.filter((x) => x !== id)
      : [...current.categories, id];
    let subcategories = current.subcategories;
    if (active) {
      const cat = CATEGORIES.find((c) => c.id === id);
      const remove = new Set(cat?.subcategories.map((s) => s.id) ?? []);
      subcategories = subcategories.filter((s) => !remove.has(s));
    }
    this.patch({ categories, subcategories });
  }

  toggleSub(id: string): void {
    const list = this.draft().subcategories;
    this.patch({
      subcategories: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    });
  }

  clearUniverses(): void {
    this.patch({ categories: [], subcategories: [] });
  }

  setCity(name: string): void {
    const city = CITIES.find((c) => c.name === name);
    this.patch({
      city: name,
      lat: city?.lat ?? this.draft().lat,
      lng: city?.lng ?? this.draft().lng,
    });
  }

  save(): void {
    if (this.draft().categories.length < 3) return;
    this.onboarding.complete(this.draft());
    this.snack.open('Préférences mises à jour — votre flux est réorganisé.', 'OK', {
      duration: 2800,
    });
    void this.router.navigate(['/client/feed']);
  }

  restartOnboarding(): void {
    this.onboarding.reset();
    void this.router.navigate(['/onboarding']);
  }
}
