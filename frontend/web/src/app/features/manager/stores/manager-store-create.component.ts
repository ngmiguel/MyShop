import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CATEGORIES } from '../../../core/data/categories';
import {
  clearStoreDraft,
  emptyStoreDraft,
  generateStoreCode,
  loadStoreDraft,
  saveStoreDraft,
  StoreDraft,
} from '../../../core/data/store-wizard.types';
import { PaymentMethod } from '../../../core/models';
import { ManagerDataService } from '../../../core/services/manager-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { MapPickerComponent } from '../../../shared/components/map-picker/map-picker.component';

const STEPS = ['Identité', 'Catégories', 'Localisation', 'Exploitation', 'Photos', 'Accès vendeurs'];
const MAX_CATEGORIES = 7;
const MAX_PHOTOS = 5;

const PAYMENTS: Array<{ id: PaymentMethod; label: string }> = [
  { id: 'mobile_money', label: 'Mobile Money' },
  { id: 'card', label: 'Carte bancaire' },
  { id: 'cash', label: 'Espèces au retrait' },
  { id: 'transfer', label: 'Virement' },
];

const LEGAL_STATUSES = ['SARL', 'SA', 'Entreprise individuelle', 'GIC / Coopérative'];

@Component({
  selector: 'app-manager-store-create',
  standalone: true,
  imports: [DecimalPipe, FormsModule, MatIconModule, MatSlideToggleModule, MatSnackBarModule, MapPickerComponent],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Créer une boutique</h1>
          <p>Renseignez les attributs du point de vente réel : le brouillon est conservé à chaque étape.</p>
        </div>
        <button type="button" class="btn-outline" (click)="saveDraft()">
          <mat-icon>save</mat-icon>
          Enregistrer le brouillon
        </button>
      </header>

      <div class="progress">
        @for (label of steps; track label; let i = $index) {
          <div class="progress-item">
            <div class="bar" [class.done]="i <= step()"></div>
            <p class="step-label" [class.active]="i <= step()">{{ label }}</p>
          </div>
        }
      </div>

      <div class="card panel">
        @switch (step()) {
          @case (0) {
            <div class="grid sm-2">
              <label class="field sm-span-2">
                <span>Nom de la boutique <em>*</em></span>
                <input [(ngModel)]="draft.name" placeholder="Marché Fraîcheur Akwa" />
              </label>
              <label class="field">
                <span>Raison sociale</span>
                <input [(ngModel)]="draft.legalName" />
              </label>
              <label class="field">
                <span>Slogan</span>
                <input [(ngModel)]="draft.tagline" placeholder="Le frais du matin, tous les matins" />
              </label>
              <label class="field sm-span-2">
                <span>Description courte <em>*</em></span>
                <input [(ngModel)]="draft.shortDescription" />
              </label>
              <label class="field sm-span-2">
                <span>Description complète</span>
                <textarea [(ngModel)]="draft.description" rows="4"></textarea>
              </label>
              <label class="field">
                <span>Année d'ouverture</span>
                <input type="number" [(ngModel)]="draft.foundedYear" />
              </label>
              <label class="field">
                <span>Statut juridique</span>
                <select [(ngModel)]="draft.legalStatus">
                  @for (s of legalStatuses; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </label>
              <label class="field sm-span-2">
                <span>Numéro d'enregistrement</span>
                <input [(ngModel)]="draft.registrationNumber" placeholder="RC/DLA/2026/B/1234" />
              </label>
            </div>
          }

          @case (1) {
            <div class="stack">
              <div>
                <div class="row-between">
                  <p class="section-title">Catégories vendues</p>
                  <span class="badge" [class.warning]="draft.categories.length >= maxCategories">
                    {{ draft.categories.length }} / {{ maxCategories }}
                  </span>
                </div>
                <div class="chips">
                  @for (c of categories; track c.id) {
                    <button
                      type="button"
                      class="chip"
                      [class.active]="draft.categories.includes(c.id)"
                      [disabled]="!draft.categories.includes(c.id) && draft.categories.length >= maxCategories"
                      (click)="toggleCategory(c.id)"
                    >
                      {{ c.label }}
                    </button>
                  }
                </div>
              </div>

              @if (draft.categories.length > 0) {
                <label class="field">
                  <span>Catégorie principale (mise en avant) <em>*</em></span>
                  <select [(ngModel)]="draft.mainCategory">
                    @for (c of draft.categories; track c) {
                      <option [value]="c">{{ categoryLabel(c) }}</option>
                    }
                  </select>
                </label>
              }

              @for (c of availableSubs; track c.id) {
                <div>
                  <p class="sub-title">{{ c.label }}</p>
                  <div class="chips sm">
                    @for (s of c.subcategories; track s.id) {
                      <button
                        type="button"
                        class="chip sm"
                        [class.active]="draft.subcategories.includes(s.id)"
                        (click)="toggleSubcategory(s.id)"
                      >
                        {{ s.label }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @case (2) {
            <div class="stack">
              <div class="grid sm-2">
                <label class="field sm-span-2">
                  <span>Adresse <em>*</em></span>
                  <input [(ngModel)]="draft.address" />
                </label>
                <label class="field">
                  <span>Ville <em>*</em></span>
                  <input [(ngModel)]="draft.city" />
                </label>
                <label class="field">
                  <span>Région</span>
                  <input [(ngModel)]="draft.region" />
                </label>
                <label class="field">
                  <span>Pays</span>
                  <input [(ngModel)]="draft.country" />
                </label>
                <label class="field">
                  <span>Repère</span>
                  <input [(ngModel)]="draft.landmark" placeholder="Face à la pharmacie" />
                </label>
              </div>

              <div>
                <app-map-picker
                  [lat]="draft.lat"
                  [lng]="draft.lng"
                  (pick)="onMapPick($event)"
                />
                <div class="grid sm-2 mt">
                  <label class="field">
                    <span>Latitude</span>
                    <input type="number" step="0.0001" [(ngModel)]="draft.lat" />
                  </label>
                  <label class="field">
                    <span>Longitude</span>
                    <input type="number" step="0.0001" [(ngModel)]="draft.lng" />
                  </label>
                </div>
              </div>

              <div>
                <label class="section-title sm" for="w-radius">
                  Zone de service : {{ draft.serviceRadiusKm }} km
                </label>
                <input
                  id="w-radius"
                  type="range"
                  min="1"
                  max="80"
                  [(ngModel)]="draft.serviceRadiusKm"
                  class="range"
                />
              </div>
            </div>
          }

          @case (3) {
            <div class="stack">
              <div>
                <p class="section-title">Horaires d'ouverture</p>
                <ul class="hours">
                  @for (h of draft.hours; track h.day; let i = $index) {
                    <li [class.is-closed]="h.closed">
                      <span class="day">{{ h.day }}</span>
                      <div class="time-pair">
                        <input
                          type="time"
                          [(ngModel)]="draft.hours[i].open"
                          [disabled]="h.closed"
                          [attr.aria-label]="'Ouverture ' + h.day"
                        />
                        <span class="sep">→</span>
                        <input
                          type="time"
                          [(ngModel)]="draft.hours[i].close"
                          [disabled]="h.closed"
                          [attr.aria-label]="'Fermeture ' + h.day"
                        />
                      </div>
                      <label class="closed-check">
                        <input type="checkbox" [(ngModel)]="draft.hours[i].closed" />
                        Fermé
                      </label>
                    </li>
                  }
                </ul>
              </div>

              <div class="grid sm-2">
                <label class="field">
                  <span>Téléphone <em>*</em></span>
                  <input [(ngModel)]="draft.phone" placeholder="+237 6XX XXX XXX" />
                </label>
                <label class="field">
                  <span>E-mail de la boutique</span>
                  <input type="email" [(ngModel)]="draft.email" />
                </label>
                <label class="field">
                  <span>Taux de taxe (%)</span>
                  <input type="number" step="0.01" [(ngModel)]="draft.taxRate" />
                </label>
                <label class="field">
                  <span>Capacité d'accueil (clients/jour)</span>
                  <input type="number" [(ngModel)]="draft.capacity" />
                </label>
              </div>

              <div>
                <p class="section-title">Moyens de paiement acceptés</p>
                <div class="chips">
                  @for (p of payments; track p.id) {
                    <button
                      type="button"
                      class="chip"
                      [class.active]="draft.paymentMethods.includes(p.id)"
                      (click)="togglePayment(p.id)"
                    >
                      {{ p.label }}
                    </button>
                  }
                </div>
              </div>

              <div class="toggles">
                <mat-slide-toggle [(ngModel)]="draft.pickup">
                  Retrait en boutique
                </mat-slide-toggle>
                <p class="toggle-hint">Requis pour la validation du code QR sur place</p>
                <mat-slide-toggle [(ngModel)]="draft.delivery">
                  Livraison
                </mat-slide-toggle>
                <p class="toggle-hint">Optionnelle, en complément du retrait</p>
              </div>
            </div>
          }

          @case (4) {
            <div class="stack">
              <div class="row-between">
                <div>
                  <p class="section-title">Photos de la boutique réelle</p>
                  <p class="hint">Facultatif · {{ draft.photos.length }} / {{ maxPhotos }}</p>
                </div>
                <label class="btn-outline upload">
                  <mat-icon>add_photo_alternate</mat-icon>
                  Ajouter
                  <input type="file" accept="image/*" multiple hidden (change)="addPhotos($event)" />
                </label>
              </div>

              @if (draft.photos.length) {
                <ul class="photo-grid">
                  @for (photo of draft.photos; track photo; let i = $index) {
                    <li>
                      <img [src]="photo" [alt]="'Photo ' + (i + 1)" />
                      <div class="photo-actions">
                        <button type="button" (click)="movePhoto(i, -1)" aria-label="Déplacer à gauche">←</button>
                        <button
                          type="button"
                          class="cover-btn"
                          [class.active]="draft.coverIndex === i"
                          (click)="draft.coverIndex = i"
                          aria-label="Définir comme couverture"
                        >
                          <mat-icon>{{ draft.coverIndex === i ? 'star' : 'star_border' }}</mat-icon>
                          Couverture
                        </button>
                        <button type="button" class="delete" (click)="deletePhoto(i)" aria-label="Supprimer">
                          <mat-icon>delete</mat-icon>
                        </button>
                        <button type="button" (click)="movePhoto(i, 1)" aria-label="Déplacer à droite">→</button>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="empty-photos">
                  Aucune photo. Cette étape est facultative — une image de catégorie sera utilisée par défaut.
                </p>
              }
            </div>
          }

          @case (5) {
            <div class="stack">
              <div class="access-box">
                <p class="access-label">
                  <mat-icon>vpn_key</mat-icon>
                  Mot de passe de la boutique
                </p>
                <p class="access-code">{{ draft.accessCode }}</p>
                <p class="hint">
                  Les vendeurs devront le saisir à l'inscription pour être rattachés à cette boutique.
                </p>
                <button type="button" class="btn-outline" (click)="regenerateCode()">
                  Générer un nouveau code
                </button>
              </div>

              <div class="grid sm-2">
                <label class="field">
                  <span>Validité du code (jours)</span>
                  <input type="number" [(ngModel)]="draft.accessCodeDays" />
                </label>
                <label class="field">
                  <span>Nombre de vendeurs autorisés</span>
                  <input type="number" [(ngModel)]="draft.maxSellers" />
                </label>
              </div>

              <div class="toggles">
                <mat-slide-toggle [(ngModel)]="draft.autoApproveSellers">
                  Validation automatique des vendeurs
                </mat-slide-toggle>
                <p class="toggle-hint">
                  Sinon, chaque inscription attend votre approbation dans la section Vendeurs
                </p>
              </div>

              <div class="summary card-inner">
                <p class="section-title">Récapitulatif</p>
                <dl>
                  <div>
                    <dt>Nom</dt>
                    <dd>{{ draft.name || '—' }}</dd>
                  </div>
                  <div>
                    <dt>Catégories</dt>
                    <dd>{{ draft.categories.length }}</dd>
                  </div>
                  <div>
                    <dt>Localisation</dt>
                    <dd>{{ draft.city }} ({{ draft.lat | number: '1.4-4' }}, {{ draft.lng | number: '1.4-4' }})</dd>
                  </div>
                  <div>
                    <dt>Photos</dt>
                    <dd>{{ draft.photos.length }} / {{ maxPhotos }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          }
        }
      </div>

      <footer class="actions">
        <button type="button" class="btn-ghost" [disabled]="step() === 0" (click)="prevStep()">
          <mat-icon>arrow_back</mat-icon>
          Retour
        </button>
        <div class="actions-right">
          @if (step() === 4) {
            <button type="button" class="btn-ghost" (click)="skipPhotos()">Passer cette étape</button>
          }
          @if (step() < steps.length - 1) {
            <button type="button" class="btn-primary" [disabled]="!stepValid()" (click)="nextStep()">
              Continuer
              <mat-icon>arrow_forward</mat-icon>
            </button>
          } @else {
            <button type="button" class="btn-primary" [disabled]="!stepValid() || !draft.name" (click)="publish()">
              <mat-icon>check_circle</mat-icon>
              Publier la boutique
            </button>
          }
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .page { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .page-head p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .progress { display: flex; gap: 6px; }
    .progress-item { flex: 1; min-width: 0; }
    .bar { height: 6px; border-radius: 999px; background: rgb(var(--line)); }
    .bar.done { background: rgb(var(--accent)); }
    .step-label { display: none; margin: 6px 0 0; font-size: 11px; color: rgb(var(--muted)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .step-label.active { color: rgb(var(--ink)); }
    @media (min-width: 640px) { .step-label { display: block; } }
    .card.panel { padding: 20px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .grid { display: grid; gap: 16px; }
    @media (min-width: 640px) { .grid.sm-2 { grid-template-columns: repeat(2, 1fr); } }
    .sm-span-2 { grid-column: 1 / -1; }
    .stack { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field span { font-size: 12px; font-weight: 600; color: rgb(var(--ink)); }
    .field em { color: rgb(var(--accent)); font-style: normal; }
    input, textarea, select {
      width: 100%; padding: 10px 12px; border-radius: 8px;
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
      font: inherit; color: rgb(var(--ink));
    }
    input:disabled { opacity: 0.5; }
    textarea { resize: vertical; min-height: 80px; }
    .section-title { margin: 0; font-size: 14px; font-weight: 600; color: rgb(var(--ink)); }
    .section-title.sm { font-size: 12px; margin-bottom: 8px; }
    .sub-title { margin: 0 0 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--muted)); }
    .row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(var(--accent), 0.1); color: rgb(var(--accent)); }
    .badge.warning { background: rgba(217, 119, 6, 0.1); color: #d97706; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .chip {
      padding: 6px 14px; border-radius: 999px; border: 1px solid rgb(var(--line));
      background: transparent; font-size: 13px; color: rgb(var(--muted)); cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s;
    }
    .chip.sm { padding: 4px 12px; font-size: 12px; }
    .chip:hover:not(:disabled) { color: rgb(var(--ink)); }
    .chip.active { border-color: rgb(var(--accent)); background: rgba(var(--accent), 0.1); color: rgb(var(--accent)); }
    .chip:disabled { opacity: 0.4; cursor: not-allowed; }
    .map-preview {
      display: flex; align-items: center; gap: 8px; padding: 24px 16px;
      border-radius: 10px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface-2, var(--surface)));
      color: rgb(var(--muted)); font-size: 13px;
    }
    .map-preview mat-icon { color: rgb(var(--accent)); }
    .map-hint { margin-left: auto; font-size: 12px; }
    .mt { margin-top: 12px; }
    .range { width: 100%; margin-top: 8px; accent-color: rgb(var(--accent)); }
    .hours { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .hours li {
      display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 12px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
    }
    .hours li.is-closed { opacity: 0.72; background: rgb(var(--surface-2)); }
    .hours .day { width: 6rem; font-size: 14px; font-weight: 600; color: rgb(var(--muted)); }
    .time-pair { display: flex; align-items: center; gap: 8px; }
    .time-pair .sep { color: rgb(var(--muted)); font-size: 12px; }
    .hours input[type='time'] { width: 8rem; padding: 6px 8px; border-radius: 8px; border: 1px solid rgb(var(--line)); }
    .closed-check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgb(var(--muted)); cursor: pointer; }
    .closed-check input { width: auto; accent-color: rgb(var(--accent)); }
    .toggles { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; border-top: 1px solid rgb(var(--line)); }
    .toggle-hint { margin: 0 0 8px; font-size: 12px; color: rgb(var(--muted)); padding-left: 2px; }
    .hint { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .upload { cursor: pointer; }
    .photo-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
    .photo-grid li { overflow: hidden; border-radius: 10px; border: 1px solid rgb(var(--line)); }
    .photo-grid img { display: block; width: 100%; height: 7rem; object-fit: cover; }
    .photo-actions { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 6px; }
    .photo-actions button { border: none; background: none; font-size: 12px; color: rgb(var(--muted)); cursor: pointer; padding: 2px 6px; }
    .photo-actions button:hover { color: rgb(var(--ink)); }
    .photo-actions .cover-btn { display: inline-flex; align-items: center; gap: 2px; }
    .photo-actions .cover-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .photo-actions .cover-btn.active { color: rgb(var(--accent)); }
    .photo-actions .delete:hover { color: #e11d48; }
    .photo-actions .delete mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-photos {
      margin: 0; padding: 32px 16px; text-align: center; font-size: 14px; color: rgb(var(--muted));
      border: 1px dashed rgb(var(--line)); border-radius: 10px;
    }
    .access-box { padding: 16px; border-radius: 10px; background: rgb(var(--surface-2, var(--surface))); }
    .access-label { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: rgb(var(--muted)); }
    .access-label mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .access-code { margin: 8px 0 0; font-family: ui-monospace, monospace; font-size: 1.5rem; font-weight: 600; letter-spacing: 0.08em; color: rgb(var(--ink)); }
    .summary.card-inner { padding: 16px; border: 1px solid rgb(var(--line)); border-radius: 10px; }
    .summary dl { margin: 8px 0 0; display: flex; flex-direction: column; gap: 6px; }
    .summary div { display: flex; justify-content: space-between; gap: 12px; font-size: 14px; }
    .summary dt { color: rgb(var(--muted)); }
    .summary dd { margin: 0; color: rgb(var(--ink)); text-align: right; }
    .actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .actions-right { display: flex; align-items: center; gap: 8px; }
    .btn-ghost, .btn-outline, .btn-primary {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
      border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .btn-ghost { border: none; background: none; color: rgb(var(--muted)); }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-outline { border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); color: rgb(var(--ink)); }
    .btn-outline:hover { border-color: rgb(var(--accent)); color: rgb(var(--accent)); }
    .btn-primary { border: none; background: rgb(var(--accent)); color: white; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary mat-icon, .btn-ghost mat-icon, .btn-outline mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `],
})
export class ManagerStoreCreateComponent implements OnInit {
  private readonly data = inject(ManagerDataService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly steps = STEPS;
  readonly categories = CATEGORIES;
  readonly payments = PAYMENTS;
  readonly legalStatuses = LEGAL_STATUSES;
  readonly maxCategories = MAX_CATEGORIES;
  readonly maxPhotos = MAX_PHOTOS;

  step = signal(0);
  draft!: StoreDraft;

  ngOnInit(): void {
    const settings = this.theme.settings();
    const fallback = emptyStoreDraft(generateStoreCode(settings.accessCodeLength));
    fallback.taxRate = settings.defaultTaxRate;
    this.draft = loadStoreDraft(fallback);
  }

  get availableSubs() {
    return CATEGORIES.filter((c) => this.draft.categories.includes(c.id));
  }

  categoryLabel(id: string): string {
    return CATEGORIES.find((c) => c.id === id)?.label ?? id;
  }

  stepValid(): boolean {
    const s = this.step();
    if (s === 0) return Boolean(this.draft.name && this.draft.shortDescription);
    if (s === 1) return this.draft.categories.length > 0 && Boolean(this.draft.mainCategory);
    if (s === 2) return Boolean(this.draft.address && this.draft.city);
    if (s === 3) return Boolean(this.draft.phone && this.draft.paymentMethods.length);
    if (s === 5) return Boolean(this.draft.accessCode);
    return true;
  }

  saveDraft(): void {
    saveStoreDraft(this.draft);
    this.snackBar.open('Brouillon enregistré', 'OK', { duration: 2000 });
  }

  onMapPick(pos: { lat: number; lng: number }): void {
    this.draft.lat = pos.lat;
    this.draft.lng = pos.lng;
  }

  toggleCategory(id: string): void {
    if (this.draft.categories.includes(id)) {
      const next = this.draft.categories.filter((c) => c !== id);
      this.draft.categories = next;
      if (this.draft.mainCategory === id) {
        this.draft.mainCategory = next[0] ?? '';
      }
      const cat = CATEGORIES.find((c) => c.id === id);
      if (cat) {
        const subIds = new Set(cat.subcategories.map((x) => x.id));
        this.draft.subcategories = this.draft.subcategories.filter((s) => !subIds.has(s));
      }
      return;
    }
    if (this.draft.categories.length >= MAX_CATEGORIES) {
      this.snackBar.open(`Maximum ${MAX_CATEGORIES} catégories par boutique`, 'OK', { duration: 2500 });
      return;
    }
    this.draft.categories = [...this.draft.categories, id];
    if (!this.draft.mainCategory) this.draft.mainCategory = id;
  }

  toggleSubcategory(id: string): void {
    const active = this.draft.subcategories.includes(id);
    this.draft.subcategories = active
      ? this.draft.subcategories.filter((x) => x !== id)
      : [...this.draft.subcategories, id];
  }

  togglePayment(id: PaymentMethod): void {
    const active = this.draft.paymentMethods.includes(id);
    this.draft.paymentMethods = active
      ? this.draft.paymentMethods.filter((m) => m !== id)
      : [...this.draft.paymentMethods, id];
  }

  addPhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - this.draft.photos.length;
    if (remaining <= 0) {
      this.snackBar.open(`Maximum ${MAX_PHOTOS} photos`, 'OK', { duration: 2500 });
      input.value = '';
      return;
    }
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          this.draft.photos = [...this.draft.photos, String(reader.result)].slice(0, MAX_PHOTOS);
        };
        reader.readAsDataURL(file);
      });
    input.value = '';
  }

  movePhoto(index: number, direction: -1 | 1): void {
    const next = [...this.draft.photos];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    this.draft.photos = next;
    if (this.draft.coverIndex === index) this.draft.coverIndex = target;
    else if (this.draft.coverIndex === target) this.draft.coverIndex = index;
  }

  deletePhoto(index: number): void {
    this.draft.photos = this.draft.photos.filter((_, i) => i !== index);
    if (this.draft.coverIndex >= this.draft.photos.length) {
      this.draft.coverIndex = Math.max(0, this.draft.photos.length - 1);
    }
  }

  regenerateCode(): void {
    this.draft.accessCode = generateStoreCode(this.theme.settings().accessCodeLength);
  }

  prevStep(): void {
    this.step.update((s) => Math.max(0, s - 1));
  }

  nextStep(): void {
    if (!this.stepValid()) return;
    this.step.update((s) => s + 1);
  }

  skipPhotos(): void {
    this.step.set(5);
  }

  publish(): void {
    if (!this.stepValid() || !this.draft.name) return;
    const store = this.data.createStore(this.draft);
    clearStoreDraft();
    this.snackBar.open(`Boutique publiée · code vendeurs ${store.accessCode}`, 'OK', { duration: 3000 });
    this.router.navigate(['/manager/stores', store.id]);
  }
}
