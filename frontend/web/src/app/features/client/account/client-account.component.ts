import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DemoRoleLoginComponent } from '../../../shared/components/auth/demo-role-login.component';

interface ClientAccount {
  name: string;
  phone: string;
  email: string;
  connected: boolean;
}

const KEY = 'boutika_client_account';

@Component({
  selector: 'app-client-account',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatSnackBarModule, DemoRoleLoginComponent],
  template: `
    <div class="page">
      <header>
        <h1>Mon compte</h1>
        <p>Le catalogue reste libre d'accès. Un compte sert à conserver panier, commandes et préférences.</p>
      </header>

      <section class="card">
        <h2>Profil client</h2>
        <div class="grid-2">
          <div>
            <label for="name">Nom complet</label>
            <input id="name" [(ngModel)]="account.name" placeholder="Votre nom" />
          </div>
          <div>
            <label for="phone">Téléphone</label>
            <input id="phone" [(ngModel)]="account.phone" placeholder="+237 6XX XXX XXX" />
          </div>
          <div class="full">
            <label for="email">E-mail</label>
            <input id="email" type="email" [(ngModel)]="account.email" />
          </div>
        </div>
        <button type="button" class="btn-primary" (click)="save()">
          <mat-icon>person</mat-icon> Enregistrer
        </button>
        @if (account.connected) {
          <span class="badge">Compte actif</span>
        }
      </section>

      <section class="card">
        <h2>Synchronisation Gmail</h2>
        <p class="desc">Retrouvez vos tickets et préférences sur tous vos appareils.</p>
        @if (gmailConnected()) {
          <p class="connected"><mat-icon>check_circle</mat-icon> {{ gmailEmail() }}</p>
          <button type="button" class="btn-outline" (click)="disconnectGmail()">Déconnecter</button>
        } @else {
          <input type="email" [(ngModel)]="gmailInput" placeholder="prenom.nom@gmail.com" />
          <button type="button" class="btn-primary" (click)="connectGmail()">Connecter Gmail</button>
        }
      </section>

      <app-demo-role-login currentRole="client" />
    </div>
  `,
  styles: [`
    .page { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    header h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    header p { margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .card { background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 12px; padding: 20px; }
    .card h2 { margin: 0 0 16px; font-size: 1rem; font-weight: 600; }
    .desc { font-size: 13px; color: rgb(var(--muted)); margin: -8px 0 16px; }
    .grid-2 { display: grid; gap: 16px; }
    @media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } .full { grid-column: span 2; } }
    label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    input { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .btn-primary, .btn-outline {
      display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; margin-right: 8px;
      padding: 10px 16px; border-radius: 999px; cursor: pointer; font-weight: 600; font-size: 14px;
    }
    .btn-primary { border: none; background: rgb(var(--accent)); color: white; }
    .btn-outline { border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    .badge { display: inline-block; margin-left: 8px; padding: 4px 10px; border-radius: 999px; background: rgba(5, 150, 105, 0.1); color: #059669; font-size: 12px; font-weight: 600; }
    .connected { display: flex; align-items: center; gap: 8px; color: rgb(var(--ink)); }
    .connected mat-icon { color: rgb(var(--accent)); font-size: 18px; width: 18px; height: 18px; }
  `],
})
export class ClientAccountComponent {
  private readonly snackBar = inject(MatSnackBar);

  account: ClientAccount = this.load();
  gmailInput = '';
  gmailConnected = signal(!!localStorage.getItem('boutika_gmail'));
  gmailEmail = signal(localStorage.getItem('boutika_gmail') ?? '');

  save(): void {
    this.account.connected = Boolean(this.account.name && this.account.email);
    localStorage.setItem(KEY, JSON.stringify(this.account));
    this.snackBar.open('Profil enregistré', 'OK', { duration: 2000 });
  }

  connectGmail(): void {
    if (!this.gmailInput.includes('@')) return;
    localStorage.setItem('boutika_gmail', this.gmailInput);
    this.gmailConnected.set(true);
    this.gmailEmail.set(this.gmailInput);
    this.snackBar.open('Gmail connecté', 'OK', { duration: 2000 });
  }

  disconnectGmail(): void {
    localStorage.removeItem('boutika_gmail');
    this.gmailConnected.set(false);
    this.gmailEmail.set('');
  }

  private load(): ClientAccount {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { name: '', phone: '', email: '', connected: false };
    try {
      return JSON.parse(raw) as ClientAccount;
    } catch {
      return { name: '', phone: '', email: '', connected: false };
    }
  }
}
