import { Injectable, signal } from '@angular/core';

export interface OnboardingState {
  completed: boolean;
  categories: string[];
  subcategories: string[];
  city: string;
  lat: number;
  lng: number;
  radiusKm: number;
  budgetMin: number;
  budgetMax: number;
  intention: 'buy' | 'compare' | 'browse';
  currency: 'XAF' | 'EUR' | 'USD';
  notifications: boolean;
  preferredMode: 'any' | 'pickup' | 'delivery';
  promosOnly: boolean;
  localOnly: boolean;
}

const KEY = 'boutika_onboarding';

const DEFAULT: OnboardingState = {
  completed: false,
  categories: [],
  subcategories: [],
  city: 'Douala',
  lat: 4.0511,
  lng: 9.7679,
  radiusKm: 15,
  budgetMin: 0,
  budgetMax: 500000,
  intention: 'browse',
  currency: 'XAF',
  notifications: true,
  preferredMode: 'any',
  promosOnly: false,
  localOnly: false,
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  readonly state = signal<OnboardingState>(this.load());

  isComplete(): boolean {
    return this.state().completed;
  }

  update(patch: Partial<OnboardingState>): void {
    const next = { ...this.state(), ...patch };
    this.state.set(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  complete(patch: Partial<OnboardingState>): void {
    this.update({ ...patch, completed: true });
  }

  reset(): void {
    localStorage.removeItem(KEY);
    this.state.set({ ...DEFAULT });
  }

  private load(): OnboardingState {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    try {
      return { ...DEFAULT, ...JSON.parse(raw) as OnboardingState };
    } catch {
      return { ...DEFAULT };
    }
  }
}
