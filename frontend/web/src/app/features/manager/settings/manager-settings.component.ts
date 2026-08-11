import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-manager-settings',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <app-page-header title="Reglages manager" />

    <div class="settings">
      @if (auth.user(); as user) {
        <div class="profile-card">
          <mat-icon>admin_panel_settings</mat-icon>
          <div>
            <strong>{{ user.firstName ?? 'Manager' }} {{ user.lastName ?? '' }}</strong>
            <span>{{ user.email }}</span>
          </div>
        </div>
      }

      <button mat-stroked-button color="warn" (click)="auth.logout()">
        <mat-icon>logout</mat-icon> Deconnexion
      </button>
    </div>
  `,
  styles: [`
    .settings { padding: 16px 24px; }
    .profile-card {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .profile-card mat-icon { font-size: 40px; width: 40px; height: 40px; color: #7c3aed; }
    .profile-card strong { display: block; }
    .profile-card span { font-size: 0.8125rem; color: var(--text-muted); }
  `],
})
export class ManagerSettingsComponent {
  readonly auth = inject(AuthService);
}
