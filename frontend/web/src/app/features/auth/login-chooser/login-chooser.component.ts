import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DemoRoleLoginComponent } from '../../../shared/components/auth/demo-role-login.component';
import { ThemeQuickToggleComponent } from '../../../shared/components/theme-quick-toggle/theme-quick-toggle.component';

const ROLES = [
  {
    to: '/client/account',
    icon: 'shopping_bag',
    title: 'Client',
    description: 'Parcourez librement le catalogue sans compte. Créez-en un pour conserver panier, commandes, tickets et préférences.',
    action: 'Gérer mon compte client',
    tone: 'emerald',
  },
  {
    to: '/auth/seller',
    icon: 'qr_code_scanner',
    title: 'Vendeur',
    description: 'Rattaché à une boutique par un mot de passe fourni par le manager. Scannez les codes QR des clients et confirmez les retraits.',
    action: 'Accéder à l\'espace vendeur',
    tone: 'amber',
  },
  {
    to: '/auth/manager',
    icon: 'dashboard',
    title: 'Manager',
    description: 'Créez et pilotez vos boutiques, suivez le décisionnel, les modèles prédictifs et le monitoring de l\'application.',
    action: 'Accéder à la console manager',
    tone: 'indigo',
  },
];

@Component({
  selector: 'app-login-chooser',
  standalone: true,
  imports: [RouterLink, MatIconModule, DemoRoleLoginComponent, ThemeQuickToggleComponent],
  template: `
    <div class="page">
      <header class="top-header">
        <a routerLink="/client/feed" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
          Retour au catalogue
        </a>
        <app-theme-quick-toggle />
      </header>

      <main class="main">
        <h1>Comment souhaitez-vous vous connecter ?</h1>
        <p class="intro">
          Boutika réunit trois espaces autour d'un même flux : le client génère un code QR de retrait,
          le vendeur le scanne en boutique, le manager mesure et pilote l'ensemble.
        </p>

        <div class="role-grid">
          @for (role of roles; track role.to) {
            <a [routerLink]="role.to" class="role-card" [class]="role.tone">
              <mat-icon>{{ role.icon }}</mat-icon>
              <h2>{{ role.title }}</h2>
              <p>{{ role.description }}</p>
              <span class="action">
                {{ role.action }}
                <mat-icon>arrow_forward</mat-icon>
              </span>
            </a>
          }
        </div>

        <app-demo-role-login currentRole="all" />
      </main>
    </div>
  `,
  styles: [`
    .page { min-height: 100dvh; display: flex; flex-direction: column; background: rgb(var(--canvas)); }
    .top-header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid rgb(var(--line)); background: rgb(var(--surface)); padding: 12px 16px;
    }
    .back-btn {
      display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500;
      color: rgb(var(--muted)); text-decoration: none; padding: 6px 10px; border-radius: 8px;
    }
    .back-btn:hover { background: rgb(var(--surface-2)); color: rgb(var(--ink)); }
    .main { max-width: 80rem; margin: 0 auto; flex: 1; padding: 40px 16px; width: 100%; }
    h1 { margin: 0; font-size: 1.875rem; font-weight: 600; color: rgb(var(--ink)); }
    .intro { margin: 8px 0 0; max-width: 42rem; font-size: 14px; color: rgb(var(--muted)); line-height: 1.6; }
    .role-grid { display: grid; gap: 16px; margin-top: 32px; }
    @media (min-width: 768px) { .role-grid { grid-template-columns: repeat(3, 1fr); } }
    .role-card {
      display: flex; flex-direction: column; padding: 20px; border-radius: 12px;
      border: 1px solid rgb(var(--line)); background: rgb(var(--surface)); text-decoration: none; color: inherit;
      transition: border-color 0.15s;
    }
    .role-card:hover { border-color: rgb(var(--accent)); }
    .role-card > mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .role-card.emerald > mat-icon { color: rgb(5 150 105); }
    .role-card.amber > mat-icon { color: rgb(217 119 6); }
    .role-card.indigo > mat-icon { color: rgb(67 56 202); }
    h2 { margin: 16px 0 0; font-size: 1.125rem; font-weight: 600; }
    .role-card p { flex: 1; margin: 8px 0 0; font-size: 14px; color: rgb(var(--muted)); line-height: 1.5; }
    .action {
      display: inline-flex; align-items: center; gap: 6px; margin-top: 16px;
      font-size: 14px; font-weight: 500; color: rgb(var(--accent));
    }
    .action mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `],
})
export class LoginChooserComponent {
  readonly roles = ROLES;
}
