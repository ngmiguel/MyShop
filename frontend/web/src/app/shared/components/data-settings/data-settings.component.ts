import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LocalOrderService } from '../../../core/services/local-order.service';
import { clearAllLocalData, downloadFile, exportAllLocalData } from '../../../core/utils/storage.util';

@Component({
  selector: 'app-data-settings',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <section class="card">
      <h2>Données & confidentialité</h2>
      <p class="desc">Tout est stocké localement dans ce navigateur.</p>
      <p class="info">
        <mat-icon>storage</mat-icon>
        Aucune donnée n'est envoyée à un serveur : préférences, panier, commandes et codes QR restent sur cet appareil.
      </p>
      <div class="actions">
        <button mat-stroked-button type="button" (click)="exportData()">
          <mat-icon>download</mat-icon>
          Exporter mes données
        </button>
        @if (showReset) {
          <button mat-stroked-button type="button" (click)="resetDemo()">
            <mat-icon>refresh</mat-icon>
            Réinitialiser les données de démonstration
          </button>
        }
        <button mat-flat-button color="warn" type="button" (click)="clearAll()">
          <mat-icon>delete</mat-icon>
          Effacer toutes les données locales
        </button>
      </div>
      <p class="version">
        <mat-icon>info</mat-icon>
        Boutika · version de démonstration 1.0
      </p>
    </section>
  `,
  styles: [`
    .card {
      background: rgb(var(--surface));
      border: 1px solid rgb(var(--line));
      border-radius: 12px;
      padding: 20px;
    }
    h2 { margin: 0 0 8px; font-size: 1rem; font-weight: 600; }
    .desc { margin: 0 0 16px; font-size: 14px; color: rgb(var(--muted)); }
    .info {
      display: flex; align-items: flex-start; gap: 8px;
      margin: 0 0 16px; padding: 10px 12px; border-radius: 8px;
      background: rgb(var(--surface-2)); font-size: 12px; color: rgb(var(--muted));
    }
    .info mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .actions button mat-icon { margin-right: 6px; }
    .version {
      display: flex; align-items: center; gap: 6px; margin: 0;
      font-size: 12px; color: rgb(var(--muted));
    }
    .version mat-icon { font-size: 14px; width: 14px; height: 14px; }
  `],
})
export class DataSettingsComponent {
  showReset = true;

  private readonly snack = inject(MatSnackBar);
  private readonly localOrders = inject(LocalOrderService);

  exportData(): void {
    downloadFile('boutika-donnees.json', exportAllLocalData());
    this.snack.open('Export téléchargé', 'OK', { duration: 2500 });
  }

  resetDemo(): void {
    this.localOrders.resetDemoOrders();
    this.snack.open('Jeu de démonstration réinitialisé', 'OK', { duration: 2500 });
    window.setTimeout(() => window.location.reload(), 700);
  }

  clearAll(): void {
    clearAllLocalData();
    this.snack.open('Données effacées — rechargement…', 'OK', { duration: 2500 });
    window.setTimeout(() => window.location.reload(), 700);
  }
}
