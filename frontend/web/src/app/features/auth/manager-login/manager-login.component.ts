import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { AuthPageShellComponent } from '../../../shared/components/auth/auth-page-shell.component';
import { DemoRoleLoginComponent } from '../../../shared/components/auth/demo-role-login.component';
import { MANAGER_DEMO } from '../../../core/data/demo-accounts';

@Component({
  selector: 'app-manager-login',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatSnackBarModule, AuthPageShellComponent, DemoRoleLoginComponent],
  template: `
    <app-auth-page-shell backLabel="Choix du rôle" backLink="/auth/login">
      <h1>Console manager</h1>
      <p class="subtitle">Accédez à la création de boutiques, au décisionnel et au monitoring de l'enseigne.</p>

      <form class="auth-form card" (ngSubmit)="login()">
        <label for="m-email">E-mail professionnel <span class="req">*</span></label>
        <input id="m-email" type="email" [(ngModel)]="email" name="email" required />

        <label for="m-pass">Mot de passe <span class="req">*</span></label>
        <input id="m-pass" type="password" [(ngModel)]="password" name="password" required placeholder="••••••" />
        <p class="hint">Démonstration : Manager2026!</p>

        <button type="submit" class="btn-primary indigo" [disabled]="loading()">
          <mat-icon>dashboard</mat-icon> Ouvrir la console
        </button>
      </form>

      <app-demo-role-login currentRole="manager" />
    </app-auth-page-shell>
  `,
  styles: [`
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .subtitle { margin: 4px 0 24px; font-size: 14px; color: rgb(var(--muted)); }
    .card {
      padding: 20px; border-radius: 12px; border: 1px solid rgb(var(--line)); background: rgb(var(--surface));
      display: flex; flex-direction: column; gap: 8px;
    }
    label { font-size: 13px; font-weight: 600; margin-top: 8px; }
    .req { color: #dc2626; }
    input {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface)); font-size: 14px;
    }
    input:focus { outline: none; border-color: rgb(var(--accent)); box-shadow: 0 0 0 3px rgba(var(--accent),0.15); }
    .hint { margin: 0; font-size: 12px; color: rgb(var(--muted)); }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      margin-top: 12px; padding: 12px; border: none; border-radius: 999px; font-weight: 600; cursor: pointer; color: white;
    }
    .btn-primary.indigo { background: rgb(67 56 202); }
    .btn-primary:disabled { opacity: 0.5; }
  `],
})
export class ManagerLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  email = MANAGER_DEMO.email!;
  password = MANAGER_DEMO.password!;
  loading = signal(false);

  login(): void {
    if (!this.email.includes('@') || this.password.length < 4) {
      this.snackBar.open('Identifiants incomplets', 'OK', { duration: 2500 });
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.user.role === 'manager') {
          this.auth.redirectByRole('manager');
        } else {
          this.snackBar.open('Accès réservé aux managers', 'OK', { duration: 3000 });
          this.auth.logout();
        }
      },
      error: () => {
        this.snackBar.open('Identifiants incorrects', 'OK', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }
}
