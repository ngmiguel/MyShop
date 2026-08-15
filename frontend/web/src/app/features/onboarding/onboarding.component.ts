import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CATEGORIES, CITIES } from '../../core/data/categories';
import { categoryImage } from '../../core/data/images';
import { OnboardingService } from '../../core/services/onboarding.service';
import { ThemeService } from '../../core/services/theme.service';

const STEPS = ["Centres d'intérêt", 'Sous-catégories', 'Localisation', 'Budget & intention', 'Confort'];

const INTENTS = [
  { id: 'buy' as const, label: 'Acheter maintenant', description: 'Priorité aux articles en stock et proches' },
  { id: 'compare' as const, label: 'Comparer', description: 'Priorité aux prix et aux avis' },
  { id: 'browse' as const, label: "S'inspirer", description: 'Découverte large, nouveautés en avant' },
];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatSlideToggleModule, DecimalPipe],
  template: `
    <div class="onboarding">
      <header class="header">
        <div class="header-top">
          <div class="brand">
            <span class="mark">B</span>
            <span>Boutika</span>
          </div>
          <button type="button" class="skip" (click)="skip()">Passer</button>
        </div>
        <div class="progress">
          @for (label of steps; track label; let i = $index) {
            <div class="bar" [class.done]="i <= step()"></div>
          }
        </div>
        <p class="step-label">Étape {{ step() + 1 }} sur {{ steps.length }} · {{ steps[step()] }}</p>
      </header>

      <main class="main">
        @switch (step()) {
          @case (0) {
            <h1>Que cherchez-vous le plus souvent ?</h1>
            <p class="hint">Choisissez au moins 3 familles. Elles orienteront votre fil « Pour vous ».</p>
            <div class="cat-grid">
              @for (c of categories; track c.id) {
                <button type="button" class="cat-card" [class.active]="selectedCategories().includes(c.id)" (click)="toggleCat(c.id)">
                  <img class="cat-bg" [src]="categoryImage(c.id)" alt="" loading="lazy" referrerpolicy="no-referrer" />
                  <span class="cat-overlay"></span>
                  <span class="cat-label">{{ c.label }}</span>
                  @if (selectedCategories().includes(c.id)) {
                    <mat-icon class="check">check</mat-icon>
                  }
                </button>
              }
            </div>
            @if (selectedCategories().length < 3) {
              <p class="warn">Encore {{ 3 - selectedCategories().length }} sélection(s) pour continuer.</p>
            }
          }
          @case (1) {
            <h1>Affinons vos familles</h1>
            <p class="hint">Sous-catégories facultatives.</p>
            @for (c of categories; track c.id) {
              @if (selectedCategories().includes(c.id)) {
                <p class="sub-head">{{ c.label }}</p>
                <div class="chips">
                  @for (s of c.subcategories; track s.id) {
                    <button type="button" class="chip" [class.active]="selectedSubs().includes(s.id)" (click)="toggleSub(s.id)">{{ s.label }}</button>
                  }
                </div>
              }
            }
          }
          @case (2) {
            <h1>Où retirez-vous vos achats ?</h1>
            <div class="city-grid">
              @for (c of cities; track c.name) {
                <button type="button" class="city-btn" [class.active]="city() === c.name" (click)="city.set(c.name)">
                  <mat-icon>location_on</mat-icon>
                  {{ c.name }}
                </button>
              }
            </div>
            <div class="panel">
              <label>Rayon de recherche : {{ radius() }} km</label>
              <input type="range" min="2" max="120" [ngModel]="radius()" (ngModelChange)="radius.set($event)" />
            </div>
          }
          @case (3) {
            <h1>Votre budget et votre intention</h1>
            <div class="panel">
              <p>{{ budgetMin() | number:'1.0-0' }} — {{ budgetMax() | number:'1.0-0' }} FCFA</p>
              <label>Minimum</label>
              <input type="range" min="0" max="1000000" step="5000" [ngModel]="budgetMin()" (ngModelChange)="budgetMin.set($event)" />
              <label>Maximum</label>
              <input type="range" min="0" max="10000000" step="25000" [ngModel]="budgetMax()" (ngModelChange)="budgetMax.set($event)" />
            </div>
            <div class="intent-grid">
              @for (i of intents; track i.id) {
                <button type="button" class="intent-card" [class.active]="intention() === i.id" (click)="intention.set(i.id)">
                  <strong>{{ i.label }}</strong>
                  <span>{{ i.description }}</span>
                </button>
              }
            </div>
          }
          @case (4) {
            <h1>Derniers réglages</h1>
            <div class="final-grid">
              <div class="panel">
                <p class="panel-title"><mat-icon>auto_awesome</mat-icon> Apparence</p>
                <div class="mode-row">
                  @for (m of themeModes; track m.id) {
                    <button type="button" [class.active]="theme.settings().theme === m.id" (click)="theme.setMode(m.id)">{{ m.label }}</button>
                  }
                </div>
                <label>Devise</label>
                <select [ngModel]="currency()" (ngModelChange)="currency.set($event)">
                  <option value="XAF">Franc CFA (FCFA)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                </select>
                <div class="toggle-row">
                  <span>Notifications</span>
                  <mat-slide-toggle [checked]="notifications()" (change)="notifications.set($event.checked)" />
                </div>
              </div>
              <div class="panel">
                <p class="panel-title"><mat-icon>mail</mat-icon> Connexion Gmail (facultatif)</p>
                <input type="email" [(ngModel)]="gmail" placeholder="prenom.nom@gmail.com" />
              </div>
            </div>
          }
        }
      </main>

      <footer class="footer">
        <button type="button" class="btn-ghost" [disabled]="step() === 0" (click)="step.set(step() - 1)">
          <mat-icon>arrow_back</mat-icon> Retour
        </button>
        @if (step() < steps.length - 1) {
          <button type="button" class="btn-primary" [disabled]="step() === 0 && selectedCategories().length < 3" (click)="step.set(step() + 1)">
            Continuer <mat-icon>arrow_forward</mat-icon>
          </button>
        } @else {
          <button type="button" class="btn-primary" (click)="finish()">
            Découvrir le catalogue <mat-icon>arrow_forward</mat-icon>
          </button>
        }
      </footer>
    </div>
  `,
  styles: [`
    .onboarding { min-height: 100dvh; display: flex; flex-direction: column; background: rgb(var(--canvas)); }
    .header { border-bottom: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .header-top { max-width: 56rem; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 16px; }
    .brand { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .mark { width: 32px; height: 32px; border-radius: 8px; background: rgb(var(--accent)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
    .skip { border: none; background: none; color: rgb(var(--muted)); cursor: pointer; text-decoration: underline; }
    .progress { max-width: 56rem; margin: 0 auto; display: flex; gap: 8px; padding: 0 16px 8px; }
    .bar { flex: 1; height: 6px; border-radius: 999px; background: rgb(var(--line)); }
    .bar.done { background: rgb(var(--accent)); }
    .step-label { max-width: 56rem; margin: 0 auto; padding: 0 16px 12px; font-size: 12px; color: rgb(var(--muted)); }
    .main { max-width: 56rem; margin: 0 auto; flex: 1; padding: 32px 16px; width: 100%; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; color: rgb(var(--ink)); }
    .hint { margin: 8px 0 24px; font-size: 14px; color: rgb(var(--muted)); }
    .cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .cat-grid { grid-template-columns: repeat(3, 1fr); } }
    .cat-card {
      position: relative; height: 112px; border-radius: 12px; border: 2px solid rgb(var(--line));
      overflow: hidden; text-align: left; padding: 0; cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
    }
    .cat-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .cat-card:hover .cat-bg { transform: scale(1.05); }
    .cat-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.55); transition: background 0.2s; }
    .cat-card.active {
      border-color: rgb(var(--accent));
      border-width: 3px;
      box-shadow: 0 0 0 4px rgba(var(--accent), 0.35), 0 8px 20px rgba(var(--accent), 0.25);
      transform: scale(1.02);
    }
    .cat-card.active .cat-overlay { background: rgba(5, 150, 105, 0.5); }
    .cat-label { position: absolute; left: 0; right: 0; bottom: 0; padding: 10px; font-size: 14px; font-weight: 600; color: white; z-index: 1; }
    .cat-card.active .cat-label { background: linear-gradient(transparent, rgba(5, 150, 105, 0.85)); }
    .check {
      position: absolute; top: 8px; right: 8px; z-index: 2;
      width: 28px; height: 28px; border-radius: 999px;
      background: rgb(var(--accent)); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .warn { margin-top: 16px; font-size: 12px; color: #d97706; }
    .sub-head { font-size: 11px; font-weight: 600; text-transform: uppercase; color: rgb(var(--muted)); margin: 16px 0 8px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .chip {
      padding: 8px 16px; border-radius: 999px; border: 2px solid rgb(var(--line));
      background: rgb(var(--surface)); font-size: 13px; font-weight: 500; cursor: pointer;
      color: rgb(var(--muted)); transition: all 0.15s;
    }
    .chip.active {
      border-color: rgb(var(--accent)); border-width: 2px;
      background: rgba(var(--accent), 0.15); color: rgb(var(--accent));
      box-shadow: 0 0 0 3px rgba(var(--accent), 0.2); font-weight: 600;
    }
    .city-grid { display: grid; gap: 12px; margin-top: 24px; }
    @media (min-width: 640px) { .city-grid { grid-template-columns: repeat(3, 1fr); } }
    .city-btn {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      border-radius: 12px; border: 2px solid rgb(var(--line)); background: rgb(var(--surface));
      cursor: pointer; font-weight: 500; transition: all 0.15s;
    }
    .city-btn.active {
      border-color: rgb(var(--accent)); border-width: 3px;
      background: rgba(var(--accent), 0.12); color: rgb(var(--accent));
      box-shadow: 0 0 0 4px rgba(var(--accent), 0.2);
    }
    .city-btn.active mat-icon { color: rgb(var(--accent)); }
    .panel { margin-top: 24px; padding: 16px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .panel label { display: block; margin-top: 12px; font-size: 12px; color: rgb(var(--muted)); }
    .panel input[type=range], .panel select, .panel input[type=email] { width: 100%; margin-top: 8px; }
    .intent-grid { display: grid; gap: 12px; margin-top: 16px; }
    @media (min-width: 640px) { .intent-grid { grid-template-columns: repeat(3, 1fr); } }
    .intent-card {
      padding: 16px; border-radius: 12px; border: 2px solid rgb(var(--line));
      background: rgb(var(--surface)); text-align: left; cursor: pointer; transition: all 0.15s;
    }
    .intent-card.active {
      border-color: rgb(var(--accent)); border-width: 3px;
      background: rgba(var(--accent), 0.12);
      box-shadow: 0 0 0 4px rgba(var(--accent), 0.2);
    }
    .intent-card.active strong { color: rgb(var(--accent)); }
    .intent-card strong { display: block; font-size: 14px; }
    .intent-card span { display: block; margin-top: 4px; font-size: 12px; color: rgb(var(--muted)); }
    .final-grid { display: grid; gap: 16px; margin-top: 24px; }
    @media (min-width: 1024px) { .final-grid { grid-template-columns: 1fr 1fr; } }
    .panel-title { display: flex; align-items: center; gap: 8px; font-weight: 600; margin: 0 0 12px; }
    .mode-row { display: flex; gap: 8px; margin-bottom: 12px; }
    .mode-row button { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); font-size: 12px; cursor: pointer; }
    .mode-row button.active { border-color: rgb(var(--accent)); background: rgba(var(--accent), 0.1); color: rgb(var(--accent)); }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .footer {
      position: sticky; bottom: 0; border-top: 1px solid rgb(var(--line)); background: rgb(var(--surface));
      max-width: 56rem; margin: 0 auto; width: 100%; display: flex; justify-content: space-between; padding: 12px 16px;
    }
    .btn-ghost { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; color: rgb(var(--muted)); cursor: pointer; }
    .btn-ghost:disabled { opacity: 0.4; cursor: default; }
    .btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 999px; border: none; background: rgb(var(--accent)); color: white; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
  `],
})
export class OnboardingComponent {
  private readonly onboarding = inject(OnboardingService);
  readonly theme = inject(ThemeService);

  readonly steps = STEPS;
  readonly categories = CATEGORIES;
  readonly cities = CITIES;
  readonly intents = INTENTS;
  readonly themeModes = [
    { id: 'light' as const, label: 'Clair' },
    { id: 'dark' as const, label: 'Sombre' },
    { id: 'system' as const, label: 'Système' },
  ];

  step = signal(0);
  selectedCategories = signal<string[]>([]);
  selectedSubs = signal<string[]>([]);
  city = signal('Douala');
  radius = signal(15);
  budgetMin = signal(0);
  budgetMax = signal(500000);
  intention = signal<'buy' | 'compare' | 'browse'>('browse');
  currency = signal<'XAF' | 'EUR' | 'USD'>('XAF');
  notifications = signal(true);
  gmail = '';

  toggleCat(id: string): void {
    const list = this.selectedCategories();
    this.selectedCategories.set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  toggleSub(id: string): void {
    const list = this.selectedSubs();
    this.selectedSubs.set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  categoryImage = categoryImage;

  skip(): void {
    const cats = this.selectedCategories().length ? this.selectedCategories() : CATEGORIES.slice(0, 6).map((c) => c.id);
    this.onboarding.complete({ categories: cats });
  }

  finish(): void {
    const selected = CITIES.find((c) => c.name === this.city()) ?? CITIES[0];
    this.onboarding.complete({
      categories: this.selectedCategories(),
      subcategories: this.selectedSubs(),
      city: selected.name,
      lat: selected.lat,
      lng: selected.lng,
      radiusKm: this.radius(),
      budgetMin: this.budgetMin(),
      budgetMax: this.budgetMax(),
      intention: this.intention(),
      currency: this.currency(),
      notifications: this.notifications(),
    });
  }
}
