import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-manager-login',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <div class="auth-page">
      <a routerLink="/auth/login" class="back"><mat-icon>arrow_back</mat-icon></a>

      <div class="auth-header">
        <mat-icon class="logo manager">admin_panel_settings</mat-icon>
        <h1>Espace manager</h1>
        <p>Administration de la marketplace</p>
      </div>

      <form class="auth-form" (ngSubmit)="login()">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" name="email" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Mot de passe</mat-label>
          <input matInput type="password" [(ngModel)]="password" name="password" required />
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" class="submit-btn" [disabled]="loading()">
          Se connecter
        </button>
      </form>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      padding: 24px;
      max-width: 420px;
      margin: 0 auto;
    }
    .back { display: inline-flex; color: var(--text-muted); margin-bottom: 16px; }
    .auth-header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 48px; width: 48px; height: 48px; }
    .logo.manager { color: #7c3aed; }
    h1 { margin: 12px 0 4px; font-size: 1.5rem; }
    p { margin: 0; color: var(--text-muted); }
    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .auth-form mat-form-field { width: 100%; }
    .submit-btn { height: 48px; margin-top: 8px; background: #7c3aed !important; }
  `],
})
export class ManagerLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  email = '';
  password = '';
  loading = signal(false);

  login(): void {
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.user.role === 'manager') {
          this.auth.redirectByRole('manager');
        } else {
          this.snackBar.open('Acces reserve aux managers', 'Fermer', { duration: 3000 });
          this.auth.logout();
        }
      },
      error: () => {
        this.snackBar.open('Identifiants incorrects', 'Fermer', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }
}
