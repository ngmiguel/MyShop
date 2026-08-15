import { Component, inject, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { DEMO_ACCOUNTS, DemoAccount } from '../../../core/data/demo-accounts';

@Component({
  selector: 'app-demo-role-login',
  standalone: true,
  imports: [MatIconModule, MatSnackBarModule],
  template: `
    <section class="demo-panel">
      <div class="demo-head">
        <mat-icon>bolt</mat-icon>
        <div>
          <h3>Connexion rapide par rôle</h3>
          <p>Sans backend — session locale de démonstration.</p>
        </div>
      </div>
      <div class="demo-grid">
        @for (account of visibleAccounts(); track account.label + account.role) {
          <button
            type="button"
            class="demo-btn"
            [class]="account.tone"
            [disabled]="loading()"
            (click)="connect(account)"
          >
            <mat-icon>{{ account.icon }}</mat-icon>
            <span class="demo-label">{{ account.label }}</span>
            <span class="demo-desc">{{ account.description }}</span>
          </button>
        }
      </div>
    </section>
  `,
  styles: [`
    .demo-panel {
      margin-top: 24px;
      padding: 16px;
      border-radius: 12px;
      border: 1px dashed rgb(var(--line));
      background: rgb(var(--surface-2));
    }
    .demo-head { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
    .demo-head mat-icon { color: rgb(var(--accent)); margin-top: 2px; }
    h3 { margin: 0; font-size: 14px; font-weight: 600; color: rgb(var(--ink)); }
    .demo-head p { margin: 2px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .demo-grid { display: grid; gap: 8px; }
    @media (min-width: 480px) { .demo-grid { grid-template-columns: 1fr 1fr; } }
    .demo-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid rgb(var(--line));
      background: rgb(var(--surface));
      cursor: pointer;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .demo-btn:hover:not(:disabled) { box-shadow: 0 2px 8px rgba(15,23,42,0.06); }
    .demo-btn:disabled { opacity: 0.6; cursor: wait; }
    .demo-btn mat-icon { font-size: 20px; width: 20px; height: 20px; margin-bottom: 4px; }
    .demo-btn.emerald mat-icon { color: rgb(5 150 105); }
    .demo-btn.amber mat-icon { color: rgb(217 119 6); }
    .demo-btn.indigo mat-icon { color: rgb(67 56 202); }
    .demo-btn.emerald:hover { border-color: rgb(5 150 105); }
    .demo-btn.amber:hover { border-color: rgb(217 119 6); }
    .demo-btn.indigo:hover { border-color: rgb(67 56 202); }
    .demo-label { font-size: 13px; font-weight: 600; color: rgb(var(--ink)); }
    .demo-desc { font-size: 11px; color: rgb(var(--muted)); }
  `],
})
export class DemoRoleLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  @Input() currentRole: 'all' | 'client' | 'vendeur' | 'manager' = 'all';

  loading = signal(false);

  visibleAccounts(): DemoAccount[] {
    if (this.currentRole === 'all') return DEMO_ACCOUNTS;
    const current = DEMO_ACCOUNTS.filter((a) => a.role === this.currentRole || a.role === 'client');
    const others = DEMO_ACCOUNTS.filter((a) => a.role !== this.currentRole && a.role !== 'client');
    return [...current, ...others.filter((a) => a.role !== 'client').slice(0, 1)];
  }

  connect(account: DemoAccount): void {
    this.loading.set(true);
    try {
      this.auth.loginDemo(account);
      if (account.role !== 'client') {
        this.snackBar.open(`Connecté en mode démo — ${account.label}`, 'OK', { duration: 2000 });
      } else {
        this.router.navigate(['/client/feed']);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
