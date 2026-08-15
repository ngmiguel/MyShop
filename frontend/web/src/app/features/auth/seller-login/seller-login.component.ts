import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { SellerService } from '../../../core/services/seller.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthPageShellComponent } from '../../../shared/components/auth/auth-page-shell.component';
import { DemoRoleLoginComponent } from '../../../shared/components/auth/demo-role-login.component';
import { Seller, Store } from '../../../core/models';
import { SELLER_DEMOS } from '../../../core/data/demo-accounts';

@Component({
  selector: 'app-seller-login',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatIconModule, MatSnackBarModule,
    AuthPageShellComponent, DemoRoleLoginComponent,
  ],
  template: `
    <app-auth-page-shell backLabel="Choix du rôle" backLink="/auth/login">
      <h1>Connexion vendeur</h1>
      <p class="subtitle">Identifiez-vous pour accéder au scanner et à la file des retraits.</p>

      <form class="auth-form card" (ngSubmit)="login()">
        <label for="v-account">Compte vendeur <span class="req">*</span></label>
        <select id="v-account" [(ngModel)]="email" name="email" required>
          <option value="">Sélectionner…</option>
          @for (s of sellers(); track s.id) {
            <option [value]="s.email">{{ s.firstName }} {{ s.lastName }} — {{ storeName(s.storeId) }}</option>
          }
          @for (d of sellerDemos; track d.email) {
            <option [value]="d.email">{{ d.label }} (démo)</option>
          }
        </select>

        @if (selectedSeller(); as sel) {
          <div class="profile-preview">
            <span class="avatar">{{ initials(sel) }}</span>
            <div>
              <p class="name">{{ sel.email }}</p>
              <p class="meta">{{ sel.position ?? 'Vendeur' }} · {{ storeName(sel.storeId) }}</p>
            </div>
            <span class="badge">Actif</span>
          </div>
        }

        <label for="v-pass">Mot de passe personnel <span class="req">*</span></label>
        <input id="v-pass" type="password" [(ngModel)]="password" name="password" required placeholder="••••••" />
        <p class="hint">Démonstration : Vendeur2026! ou au moins 4 caractères</p>

        <button type="submit" class="btn-primary amber" [disabled]="loading()">
          <mat-icon>login</mat-icon> Se connecter
        </button>
      </form>

      <p class="footer-link">
        Nouveau vendeur ?
        <a routerLink="/auth/seller/signup">S'inscrire avec le mot de passe de ma boutique</a>
      </p>

      <app-demo-role-login currentRole="vendeur" />
    </app-auth-page-shell>
  `,
  styles: [`
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .subtitle { margin: 4px 0 24px; font-size: 14px; color: rgb(var(--muted)); }
    .card {
      padding: 20px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
      display: flex; flex-direction: column; gap: 8px;
    }
    label { font-size: 13px; font-weight: 600; color: rgb(var(--ink)); margin-top: 8px; }
    .req { color: #dc2626; }
    select, input {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface)); color: rgb(var(--ink)); font-size: 14px;
    }
    select:focus, input:focus { outline: none; border-color: rgb(var(--accent)); box-shadow: 0 0 0 3px rgba(var(--accent),0.15); }
    .hint { margin: 0; font-size: 12px; color: rgb(var(--muted)); }
    .profile-preview {
      display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: rgb(var(--surface-2));
    }
    .avatar {
      width: 40px; height: 40px; border-radius: 999px; background: rgba(var(--accent),0.1);
      display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; color: rgb(var(--accent));
    }
    .name { margin: 0; font-size: 14px; font-weight: 500; }
    .meta { margin: 2px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .badge { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: rgba(5,150,105,0.1); color: #059669; font-size: 11px; font-weight: 600; }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 12px; padding: 12px; border: none; border-radius: 999px; font-weight: 600; cursor: pointer; color: white;
    }
    .btn-primary.amber { background: rgb(217 119 6); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .footer-link { margin-top: 16px; text-align: center; font-size: 14px; color: rgb(var(--muted)); }
    .footer-link a { color: rgb(var(--accent)); font-weight: 500; text-decoration: none; }
    .footer-link a:hover { text-decoration: underline; }
  `],
})
export class SellerLoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly sellerService = inject(SellerService);
  private readonly storeService = inject(StoreService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sellerDemos = SELLER_DEMOS;

  sellers = signal<Seller[]>([]);
  stores = signal<Store[]>([]);
  loading = signal(false);

  email = '';
  password = 'Vendeur2026!';

  ngOnInit(): void {
    this.sellerService.getSellers({ status: 'active' }).subscribe({
      next: (res) => this.sellers.set(res.data ?? []),
      error: () => this.sellers.set([]),
    });
    this.storeService.getStores().subscribe({
      next: (res) => this.stores.set(res.data ?? []),
      error: () => this.stores.set([]),
    });
  }

  selectedSeller(): Seller | undefined {
    return this.sellers().find((s) => s.email === this.email);
  }

  storeName(storeId: string): string {
    return this.stores().find((s) => s.id === storeId)?.name ?? 'Boutique';
  }

  initials(s: Seller): string {
    return `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase();
  }

  login(): void {
    if (!this.email) {
      this.snackBar.open('Sélectionnez votre compte vendeur', 'OK', { duration: 2500 });
      return;
    }
    if (this.password.length < 4) {
      this.snackBar.open('Mot de passe personnel trop court', 'OK', { duration: 2500 });
      return;
    }
    this.loading.set(true);
    this.auth.loginSeller(this.email, this.password).subscribe({
      next: () => this.auth.redirectByRole('vendeur'),
      error: () => {
        this.snackBar.open('Identifiants incorrects', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }
}
