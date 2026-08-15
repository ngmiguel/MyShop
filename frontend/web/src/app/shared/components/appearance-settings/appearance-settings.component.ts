import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ACCENT_PRESETS, AppSettings, ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-appearance-settings',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatSlideToggleModule],
  template: `
    <section class="card">
      <h2>Apparence</h2>
      <p class="desc">Theme, couleur d'accent et confort de lecture</p>

      <p class="label">Theme</p>
      <div class="mode-grid">
        @for (mode of modes; track mode.id) {
          <button type="button" class="mode-btn" [class.active]="theme.settings().theme === mode.id" (click)="theme.setMode(mode.id)">
            <mat-icon>{{ mode.icon }}</mat-icon>
            {{ mode.label }}
          </button>
        }
      </div>

      <p class="label">Couleur d'accent</p>
      <div class="accent-row">
        @for (a of accents; track a.id) {
          <button
            type="button"
            class="accent-dot"
            [class.active]="theme.settings().accent === a.id"
            [attr.aria-label]="a.label"
            [style.background]="'rgb(' + a.rgb + ')'"
            (click)="theme.update({ accent: a.id })"
          ></button>
        }
      </div>

      <div class="grid-2">
        <div>
          <label for="text-size">Taille du texte</label>
          <select id="text-size" [ngModel]="theme.settings().textSize" (ngModelChange)="onTextSize($event)">
            <option value="sm">Compacte</option>
            <option value="md">Normale</option>
            <option value="lg">Grande</option>
          </select>
        </div>
        <div>
          <label for="density">Densite d'affichage</label>
          <select id="density" [ngModel]="theme.settings().density" (ngModelChange)="onDensity($event)">
            <option value="comfortable">Confortable</option>
            <option value="compact">Compacte</option>
          </select>
        </div>
      </div>

      <div class="toggle-row">
        <div>
          <strong>Reduire les animations</strong>
          <p>Desactive les transitions pour un affichage plus stable</p>
        </div>
        <mat-slide-toggle [checked]="theme.settings().reduceMotion" (change)="theme.update({ reduceMotion: $event.checked })" />
      </div>
    </section>
  `,
  styles: [`
    .card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      padding: 20px;
    }
    h2 { margin: 0; font-size: 1rem; font-weight: 600; color: rgb(var(--ink)); }
    .desc { margin: 4px 0 20px; font-size: 13px; color: rgb(var(--muted)); }
    .label {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgb(var(--muted));
    }
    .mode-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }
    .mode-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      font-size: 12px;
      font-weight: 500;
      color: rgb(var(--muted));
      cursor: pointer;
    }
    .mode-btn.active {
      border-color: rgb(var(--accent));
      background: rgba(var(--accent), 0.1);
      color: rgb(var(--accent));
    }
    .accent-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .accent-dot {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      border: 2px solid transparent;
      cursor: pointer;
    }
    .accent-dot.active { border-color: rgb(var(--ink)); }
    .grid-2 {
      display: grid;
      gap: 16px;
      margin-bottom: 16px;
    }
    @media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }
    label { font-size: 12px; font-weight: 600; color: rgb(var(--ink)); }
    select {
      width: 100%;
      margin-top: 6px;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      color: rgb(var(--ink));
    }
    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid rgb(var(--line));
    }
    .toggle-row strong { display: block; font-size: 14px; }
    .toggle-row p { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
  `],
})
export class AppearanceSettingsComponent {
  readonly theme = inject(ThemeService);
  readonly accents = ACCENT_PRESETS;

  modes = [
    { id: 'light' as const, label: 'Clair', icon: 'light_mode' },
    { id: 'dark' as const, label: 'Sombre', icon: 'dark_mode' },
    { id: 'system' as const, label: 'Systeme', icon: 'brightness_auto' },
  ];

  onTextSize(v: AppSettings['textSize']): void {
    this.theme.update({ textSize: v });
  }

  onDensity(v: AppSettings['density']): void {
    this.theme.update({ density: v });
  }
}
