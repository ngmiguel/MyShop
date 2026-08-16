import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RoleShellComponent, ShellNavItem } from '../../shared/components/role-shell/role-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { SellerDataService } from '../../core/services/seller-data.service';
import { getSellerByUserId } from '../../core/data/demo-sellers';

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [RoleShellComponent],
  template: `
    <app-role-shell
      [title]="sellerName()"
      [subtitle]="subtitle()"
      accentClass="amber"
      [items]="nav"
      [badge]="true"
    >
      <div shellBadge class="pending-badge">
        <span>Retraits en attente</span>
        <strong [class.warn]="pending() > 0">{{ pending() }}</strong>
      </div>
    </app-role-shell>
  `,
  styles: [`
    .pending-badge {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 8px;
      background: rgb(var(--surface-2));
      font-size: 12px;
      color: rgb(var(--muted));
    }
    .pending-badge strong { font-size: 14px; color: rgb(var(--ink)); }
    .pending-badge strong.warn { color: #d97706; }
  `],
})
export class SellerLayoutComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly sellerData = inject(SellerDataService);

  pending = signal(0);
  sellerName = signal('Espace vendeur');
  subtitle = signal('Boutique');

  private refreshTimer?: ReturnType<typeof setInterval>;

  nav: ShellNavItem[] = [
    { to: '/seller/home', label: 'Accueil', icon: 'home', exact: true },
    { to: '/seller/scanner', label: 'Scanner', icon: 'qr_code_scanner' },
    { to: '/seller/queue', label: 'File des retraits', icon: 'checklist' },
    { to: '/seller/performance', label: 'Ma performance', icon: 'bar_chart' },
    { to: '/seller/stock', label: 'Stock & caisse', icon: 'inventory_2' },
    { to: '/seller/profit', label: 'Profit boutique', icon: 'account_balance_wallet' },
    { to: '/seller/settings', label: 'Paramètres', icon: 'settings' },
  ];

  ngOnInit(): void {
    const user = this.auth.user();
    const seller = user ? getSellerByUserId(user.id) : undefined;
    if (seller) {
      this.sellerName.set(`${seller.firstName} ${seller.lastName}`.trim());
      this.subtitle.set(`${seller.position} · ${this.sellerData.storeName()}`);
    } else if (user) {
      this.sellerName.set(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email);
      this.subtitle.set(this.sellerData.storeName());
    }
    this.refreshPending();
    this.refreshTimer = setInterval(() => this.refreshPending(), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  private refreshPending(): void {
    this.sellerData.refreshOrders().subscribe({
      next: () => this.pending.set(this.sellerData.pendingCount()),
      error: () => this.pending.set(0),
    });
  }
}
