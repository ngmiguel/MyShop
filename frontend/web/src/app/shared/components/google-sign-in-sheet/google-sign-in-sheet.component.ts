import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

const DEMO_ACCOUNTS = [
  { email: 'awa.kone@gmail.com', name: 'Awa Koné', initials: 'AK' },
  { email: 'ibrahim.toure@gmail.com', name: 'Ibrahim Touré', initials: 'IT' },
];

const SCOPES = [
  { title: 'Profil de base', detail: 'Nom, adresse e-mail et photo de profil' },
  { title: 'Gmail — envoi de reçus', detail: 'Envoyer vos tickets de caisse à votre boîte' },
  { title: 'Google Drive (dossier app)', detail: 'Sauvegarder préférences, favoris et panier' },
  { title: 'Contacts (facultatif)', detail: 'Préremplir vos coordonnées au paiement' },
  { title: 'Agenda (facultatif)', detail: 'Rappels de retrait en boutique' },
];

@Component({
  selector: 'app-google-sign-in-sheet',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  template: `
    <div class="backdrop" (click)="close.emit()">
      <div class="sheet" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="g-title">
        <header>
          <div class="brand">
            <span class="g-mark">G</span>
            <div>
              <h2 id="g-title">{{ authStep() ? 'Autorisations Boutika' : 'Se connecter avec Google' }}</h2>
              <p>{{ authStep() ? chosen()!.email : 'Choisissez un compte démo ou saisissez le vôtre' }}</p>
            </div>
          </div>
          <button type="button" class="icon-close" (click)="close.emit()" aria-label="Fermer">
            <mat-icon>close</mat-icon>
          </button>
        </header>

        @if (!authStep()) {
          <div class="accounts">
            @for (a of accounts; track a.email) {
              <button type="button" class="account" (click)="pick(a)">
                <span class="avatar">{{ a.initials }}</span>
                <span>
                  <strong>{{ a.name }}</strong>
                  <small>{{ a.email }}</small>
                </span>
                <mat-icon>chevron_right</mat-icon>
              </button>
            }
          </div>
          <div class="other">
            <p>Autre compte Gmail</p>
            <input type="text" [(ngModel)]="otherName" placeholder="Nom affiché" />
            <input type="email" [(ngModel)]="otherEmail" placeholder="prenom.nom@gmail.com" />
            @if (error()) {
              <p class="error">{{ error() }}</p>
            }
            <button type="button" class="btn-outline" (click)="pickOther()">Continuer</button>
          </div>
        } @else {
          <ul class="scopes">
            @for (s of scopes; track s.title) {
              <li>
                <mat-icon>check_circle</mat-icon>
                <div>
                  <strong>{{ s.title }}</strong>
                  <p>{{ s.detail }}</p>
                </div>
              </li>
            }
          </ul>
          <div class="footer">
            <button type="button" class="btn-ghost" (click)="authStep.set(false)">Retour</button>
            <button type="button" class="btn-primary" (click)="authorize()">
              Autoriser et synchroniser
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; z-index: 120;
      background: rgb(11 18 32 / 0.6);
      display: flex; align-items: flex-end; justify-content: center;
      padding: 16px;
    }
    @media (min-width: 720px) {
      .backdrop { align-items: center; }
    }
    .sheet {
      width: min(480px, 100%);
      max-height: min(90dvh, 720px);
      overflow: auto;
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 18px;
      box-shadow: 0 24px 60px rgb(15 23 42 / 0.25);
    }
    header {
      display: flex; justify-content: space-between; gap: 12px;
      padding: 18px 18px 12px; border-bottom: 1px solid rgb(var(--line));
    }
    .brand { display: flex; gap: 12px; align-items: flex-start; }
    .g-mark {
      width: 36px; height: 36px; border-radius: 999px;
      display: grid; place-items: center; font-weight: 800;
      background: conic-gradient(#4285f4 0 25%, #34a853 0 50%, #fbbc05 0 75%, #ea4335 0 100%);
      color: white; font-size: 14px;
    }
    h2 { margin: 0; font-size: 1rem; font-weight: 700; }
    header p { margin: 2px 0 0; font-size: 0.8rem; color: rgb(var(--muted)); }
    .icon-close {
      border: none; background: transparent; cursor: pointer; color: rgb(var(--muted));
    }
    .accounts { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    .account {
      display: flex; align-items: center; gap: 12px; width: 100%;
      padding: 12px; border: none; border-radius: 12px;
      background: transparent; cursor: pointer; text-align: left;
    }
    .account:hover { background: rgb(var(--surface-2)); }
    .avatar {
      width: 40px; height: 40px; border-radius: 999px;
      display: grid; place-items: center; font-weight: 800; font-size: 12px;
      background: rgb(15 23 42); color: white;
    }
    .account strong { display: block; font-size: 0.9rem; }
    .account small { color: rgb(var(--muted)); font-size: 0.75rem; }
    .account mat-icon { margin-left: auto; color: rgb(var(--muted)); }
    .other { padding: 8px 18px 18px; border-top: 1px solid rgb(var(--line)); }
    .other p { margin: 0 0 8px; font-size: 0.8rem; font-weight: 700; color: rgb(var(--muted)); }
    .other input {
      width: 100%; margin-bottom: 8px; padding: 10px 12px;
      border-radius: 10px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
    }
    .error { color: #dc2626; font-size: 0.8rem; margin: 0 0 8px; }
    .scopes { list-style: none; margin: 0; padding: 12px 18px; }
    .scopes li {
      display: flex; gap: 10px; padding: 10px 0;
      border-bottom: 1px solid rgb(var(--line));
    }
    .scopes li:last-child { border-bottom: none; }
    .scopes mat-icon { color: #059669; }
    .scopes strong { display: block; font-size: 0.875rem; }
    .scopes p { margin: 2px 0 0; font-size: 0.75rem; color: rgb(var(--muted)); }
    .footer {
      display: flex; justify-content: space-between; gap: 8px;
      padding: 12px 18px 18px; border-top: 1px solid rgb(var(--line));
    }
    .btn-ghost {
      border: none; background: transparent; color: rgb(var(--muted));
      cursor: pointer; font-weight: 600;
    }
  `],
})
export class GoogleSignInSheetComponent {
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly connected = new EventEmitter<string>();

  readonly accounts = DEMO_ACCOUNTS;
  readonly scopes = SCOPES;
  readonly authStep = signal(false);
  readonly chosen = signal<(typeof DEMO_ACCOUNTS)[number] | null>(null);
  readonly error = signal<string | null>(null);

  otherName = '';
  otherEmail = '';

  pick(account: (typeof DEMO_ACCOUNTS)[number]): void {
    this.chosen.set(account);
    this.authStep.set(true);
    this.error.set(null);
  }

  pickOther(): void {
    const email = this.otherEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.error.set('Adresse Gmail invalide.');
      return;
    }
    const name = this.otherName.trim() || email.split('@')[0];
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join() || '?';
    this.pick({ email, name, initials });
  }

  authorize(): void {
    const account = this.chosen();
    if (!account) return;
    localStorage.setItem('boutika_gmail', account.email);
    const raw = localStorage.getItem('boutika_client_account');
    const base = raw ? JSON.parse(raw) as { name: string; phone: string; email: string; connected: boolean } : {
      name: '', phone: '', email: '', connected: false,
    };
    localStorage.setItem('boutika_client_account', JSON.stringify({
      ...base,
      name: base.name || account.name,
      email: account.email,
      connected: true,
    }));
    this.connected.emit(account.email);
    this.close.emit();
  }
}
