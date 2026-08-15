import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SellerService } from '../../../core/services/seller.service';
import { AuthPageShellComponent } from '../../../shared/components/auth/auth-page-shell.component';
import { DemoRoleLoginComponent } from '../../../shared/components/auth/demo-role-login.component';

@Component({
  selector: 'app-seller-signup',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, MatSnackBarModule, AuthPageShellComponent, DemoRoleLoginComponent],
  template: `
    <app-auth-page-shell backLabel="Connexion" backLink="/auth/seller">
      <h1>Inscription vendeur</h1>
      <p class="subtitle">Rejoignez une boutique avec le mot de passe fourni par le manager.</p>

      @if (step() === 0) {
        <div class="card">
          <label>Code boutique</label>
          <input [(ngModel)]="accessCode" placeholder="XXXX-0000" class="mono" />
          <button type="button" class="btn-primary amber" [disabled]="accessCode.length < 4" (click)="step.set(1)">Continuer</button>
        </div>
      } @else {
        <div class="card">
          <div class="grid-2">
            <div><label>Prénom</label><input [(ngModel)]="firstName" /></div>
            <div><label>Nom</label><input [(ngModel)]="lastName" /></div>
          </div>
          <label>E-mail</label>
          <input type="email" [(ngModel)]="email" />
          <label>Téléphone</label>
          <input [(ngModel)]="phone" placeholder="+237 6XX XXX XXX" />
          <label>Mot de passe</label>
          <input type="password" [(ngModel)]="password" />
          <button type="button" class="btn-primary amber" (click)="submit()" [disabled]="loading()">Créer mon compte vendeur</button>
        </div>
      }

      <p class="footer-link">
        Déjà inscrit ? <a routerLink="/auth/seller">Se connecter</a>
      </p>

      <app-demo-role-login currentRole="vendeur" />
    </app-auth-page-shell>
  `,
  styles: [`
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .subtitle { margin: 4px 0 24px; font-size: 14px; color: rgb(var(--muted)); }
    .card { padding: 20px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); display: flex; flex-direction: column; gap: 8px; }
    label { font-size: 13px; font-weight: 600; margin-top: 8px; }
    input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); }
    input.mono { font-family: monospace; text-transform: uppercase; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .btn-primary { margin-top: 16px; padding: 12px; border: none; border-radius: 999px; font-weight: 600; color: white; cursor: pointer; }
    .btn-primary.amber { background: rgb(217 119 6); }
    .btn-primary:disabled { opacity: 0.5; }
    .footer-link { margin-top: 16px; text-align: center; font-size: 14px; color: rgb(var(--muted)); }
    .footer-link a { color: rgb(var(--accent)); font-weight: 500; }
  `],
})
export class SellerSignupComponent {
  private readonly sellerService = inject(SellerService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  step = signal(0);
  loading = signal(false);
  accessCode = '';
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';

  submit(): void {
    this.loading.set(true);
    this.sellerService.register({
      accessCode: this.accessCode,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      password: this.password,
    }).subscribe({
      next: () => {
        this.snackBar.open('Compte vendeur créé', 'OK', { duration: 2500 });
        this.router.navigate(['/auth/seller']);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Inscription impossible', 'OK', { duration: 2500 });
      },
    });
  }
}
