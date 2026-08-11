import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent],
  template: `
    <app-page-header title="Reglages vendeur" />

    <div class="settings">
      @if (auth.user(); as user) {
        <div class="profile-card">
          <mat-icon>badge</mat-icon>
          <div>
            <strong>{{ user.firstName ?? 'Vendeur' }} {{ user.lastName ?? '' }}</strong>
            <span>{{ user.email }}</span>
            @if (user.storeId) {
              <span class="store">Boutique: {{ user.storeId }}</span>
            }
          </div>
        </div>
      }

      <button mat-stroked-button color="warn" (click)="auth.logout()">
        <mat-icon>logout</mat-icon> Deconnexion
      </button>
    </div>
  `,
  styles: [`
    .settings { padding: 16px; }
    .profile-card {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .profile-card mat-icon { font-size: 40px; width: 40px; height: 40px; color: #059669; }
    .profile-card strong { display: block; }
    .profile-card span { display: block; font-size: 0.8125rem; color: var(--text-muted); }
    .store { margin-top: 4px; }
  `],
})
export class SellerSettingsComponent {
  readonly auth = inject(AuthService);
}
