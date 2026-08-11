import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserService, UserPreferences } from '../../../core/services/user.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-client-settings',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Parametres" />

    <div class="settings">
      @if (auth.user(); as user) {
        <section class="section">
          <h2>Compte</h2>
          <div class="profile-card">
            <mat-icon>account_circle</mat-icon>
            <div>
              <strong>{{ user.firstName ?? user.email }}</strong>
              <span>{{ user.email }}</span>
            </div>
          </div>
          <button mat-stroked-button color="warn" (click)="auth.logout()">
            <mat-icon>logout</mat-icon> Deconnexion
          </button>
        </section>
      } @else {
        <section class="section">
          <h2>Compte</h2>
          <p class="hint">Connectez-vous pour synchroniser vos commandes.</p>
          <a mat-flat-button color="primary" routerLink="/auth/login">Se connecter</a>
        </section>
      }

      <section class="section">
        <h2>Preferences</h2>
        <div class="pref-row">
          <span>Notifications</span>
          <mat-slide-toggle [(ngModel)]="prefs.notifications" (change)="savePrefs()" />
        </div>
      </section>

      <section class="section">
        <h2>Autres espaces</h2>
        <a class="link-row" routerLink="/auth/seller">
          <mat-icon>badge</mat-icon> Espace vendeur
        </a>
        <a class="link-row" routerLink="/auth/manager">
          <mat-icon>admin_panel_settings</mat-icon> Espace manager
        </a>
      </section>
    </div>
  `,
  styles: [`
    .settings { padding: 16px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0 0 12px; }
    .profile-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-bottom: 12px;
    }
    .profile-card mat-icon { font-size: 40px; width: 40px; height: 40px; color: var(--primary); }
    .profile-card strong { display: block; font-size: 0.9375rem; }
    .profile-card span { font-size: 0.8125rem; color: var(--text-muted); }
    .hint { font-size: 0.875rem; color: var(--text-muted); margin-bottom: 12px; }
    .pref-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
    }
    .link-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      text-decoration: none;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      font-size: 0.9375rem;
    }
  `],
})
export class ClientSettingsComponent {
  readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  prefs: UserPreferences = this.userService.getPreferences();

  savePrefs(): void {
    this.userService.savePreferences(this.prefs);
    this.snackBar.open('Preferences enregistrees', 'OK', { duration: 2000 });
  }
}
