import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentPreset = 'emerald' | 'indigo' | 'amber' | 'rose' | 'cyan' | 'slate';
export type TextSize = 'sm' | 'md' | 'lg';
export type Density = 'comfortable' | 'compact';
export type DateFormat = 'dd/MM/yyyy' | 'yyyy-MM-dd';

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentPreset;
  textSize: TextSize;
  density: Density;
  reduceMotion: boolean;
  dateFormat: DateFormat;
  scannerSound: boolean;
  scannerVibration: boolean;
  scannerAutoConfirm: boolean;
  queueNotifications: boolean;
  defaultTaxRate: number;
  accessCodeLength: number;
  qrExpiryHours: number;
  modelRefreshHours: number;
  alertLatencyMs: number;
  alertErrorRate: number;
}

export const ACCENT_PRESETS: Array<{ id: AccentPreset; label: string; rgb: string }> = [
  { id: 'emerald', label: 'Emeraude', rgb: '5 150 105' },
  { id: 'indigo', label: 'Indigo', rgb: '67 56 202' },
  { id: 'amber', label: 'Ambre', rgb: '217 119 6' },
  { id: 'rose', label: 'Rose', rgb: '225 29 72' },
  { id: 'cyan', label: 'Cyan', rgb: '8 145 178' },
  { id: 'slate', label: 'Ardoise', rgb: '51 65 85' },
];

const KEY = 'boutika_settings';

const DEFAULTS: AppSettings = {
  theme: 'system',
  accent: 'emerald',
  textSize: 'md',
  density: 'comfortable',
  reduceMotion: false,
  dateFormat: 'dd/MM/yyyy',
  scannerSound: true,
  scannerVibration: false,
  scannerAutoConfirm: false,
  queueNotifications: true,
  defaultTaxRate: 19.25,
  accessCodeLength: 9,
  qrExpiryHours: 24,
  modelRefreshHours: 6,
  alertLatencyMs: 400,
  alertErrorRate: 1.5,
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly settings = signal<AppSettings>(this.load());
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    this.apply();
    this.mediaQuery.addEventListener('change', () => {
      if (this.settings().theme === 'system') this.applyDarkClass();
    });
  }

  mode(): ThemeMode {
    return this.settings().theme;
  }

  setMode(mode: ThemeMode): void {
    this.update({ theme: mode });
  }

  cycleMode(): void {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(this.settings().theme) + 1) % order.length];
    this.setMode(next);
  }

  update(patch: Partial<AppSettings>): void {
    const next = { ...this.settings(), ...patch };
    this.settings.set(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    this.apply();
  }

  modeLabel(): string {
    const m = this.settings().theme;
    return { light: 'Clair', dark: 'Sombre', system: 'Systeme' }[m];
  }

  private load(): AppSettings {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    try {
      return { ...DEFAULTS, ...JSON.parse(raw) as AppSettings };
    } catch {
      return { ...DEFAULTS };
    }
  }

  private apply(): void {
    this.applyDarkClass();
    const accent = ACCENT_PRESETS.find((a) => a.id === this.settings().accent) ?? ACCENT_PRESETS[0];
    document.documentElement.style.setProperty('--accent', accent.rgb);
    document.documentElement.classList.toggle('reduce-motion', this.settings().reduceMotion);
    const size = this.settings().textSize === 'sm' ? '15px' : this.settings().textSize === 'lg' ? '17.5px' : '16px';
    document.documentElement.style.setProperty('--root-size', size);
    document.documentElement.style.setProperty('--density', this.settings().density === 'compact' ? '0.8' : '1');
  }

  private applyDarkClass(): void {
    const s = this.settings().theme;
    const dark = s === 'dark' || (s === 'system' && this.mediaQuery.matches);
    document.documentElement.classList.toggle('dark', dark);
  }

  playScannerFeedback(): void {
    const s = this.settings();
    if (s.scannerSound) {
      try {
        const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        osc.frequency.value = 880;
        osc.connect(ctx.destination);
        osc.start();
        window.setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 120);
      } catch { /* audio unavailable */ }
    }
    if (s.scannerVibration && navigator.vibrate) navigator.vibrate(60);
  }
}
