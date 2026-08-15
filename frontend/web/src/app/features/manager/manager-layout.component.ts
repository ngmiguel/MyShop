import { Component, inject, OnInit, signal } from '@angular/core';
import { RoleShellComponent, ShellNavItem } from '../../shared/components/role-shell/role-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { ManagerDataService } from '../../core/services/manager-data.service';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [RoleShellComponent],
  template: `
    <app-role-shell
      [title]="managerName()"
      [subtitle]="subtitle()"
      accentClass="indigo"
      [items]="nav"
      [badge]="true"
    >
      <div shellBadge class="alert-badge">
        <span>Alertes ouvertes</span>
        <strong [class.danger]="alerts() > 0">{{ alerts() }}</strong>
      </div>
    </app-role-shell>
  `,
  styles: [`
    .alert-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgb(var(--surface-2));
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .alert-badge strong { font-size: 14px; color: #059669; }
    .alert-badge strong.danger { color: #dc2626; }
  `],
})
export class ManagerLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly data = inject(ManagerDataService);

  managerName = signal('Manager');
  subtitle = signal('Boutiques · Cameroun');
  alerts = signal(0);

  nav: ShellNavItem[] = [
    { to: '/manager/dashboard', label: 'Tableau de bord', icon: 'dashboard', exact: true },
    { to: '/manager/stores', label: 'Boutiques', icon: 'store' },
    { to: '/manager/sellers', label: 'Vendeurs', icon: 'group' },
    { to: '/manager/analytics', label: 'Analyses', icon: 'pie_chart' },
    { to: '/manager/models', label: 'Modèles', icon: 'psychology' },
    { to: '/manager/monitoring', label: 'Monitoring', icon: 'monitor_heart' },
    { to: '/manager/profit', label: 'Profit', icon: 'account_balance_wallet' },
    { to: '/manager/settings', label: 'Paramètres', icon: 'settings' },
  ];

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.managerName.set(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email);
    }
    this.subtitle.set(`${this.data.getManagerStores().length} boutiques · Cameroun`);
    this.alerts.set(this.data.openAlertsCount());
  }
}
