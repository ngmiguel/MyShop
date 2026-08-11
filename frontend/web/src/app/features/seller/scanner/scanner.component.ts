import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Scanner" subtitle="Valider une commande par code" />

    <div class="scanner">
      <div class="scan-area">
        <mat-icon>qr_code_scanner</mat-icon>
        <p>Saisissez le code de retrait du client</p>
      </div>

      <mat-form-field appearance="outline" class="code-field">
        <mat-label>Code de retrait</mat-label>
        <input matInput [(ngModel)]="code" placeholder="Ex: ABC123" (keyup.enter)="validate()" />
      </mat-form-field>

      <button mat-flat-button class="validate-btn" [disabled]="!code.trim() || loading()" (click)="validate()">
        <mat-icon>check_circle</mat-icon>
        Valider la commande
      </button>

      @if (lastOrder()) {
        <div class="result-card success">
          <mat-icon>check_circle</mat-icon>
          <div>
            <strong>Commande #{{ lastOrder()!.orderNumber }} validee</strong>
            <span>Total: {{ lastOrder()!.total }} XOF</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scanner { padding: 16px; }
    .scan-area {
      text-align: center;
      padding: 40px 24px;
      background: var(--surface-alt);
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .scan-area mat-icon { font-size: 64px; width: 64px; height: 64px; color: #059669; }
    .scan-area p { margin: 12px 0 0; color: var(--text-muted); }
    .code-field { width: 100%; }
    .validate-btn {
      width: 100%;
      height: 52px;
      background: #059669 !important;
      margin-bottom: 16px;
    }
    .result-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
    }
    .result-card.success { background: #d1fae5; color: #065f46; }
    .result-card strong { display: block; }
    .result-card span { font-size: 0.8125rem; }
  `],
})
export class ScannerComponent {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);

  code = '';
  loading = signal(false);
  lastOrder = signal<Order | null>(null);

  validate(): void {
    if (!this.code.trim()) return;
    this.loading.set(true);

    this.orderService.getOrders({ status: 'ready' }).subscribe({
      next: (res) => {
        const match = (res.data ?? []).find(
          (o) => o.pickupCode.toUpperCase() === this.code.trim().toUpperCase(),
        );
        if (!match) {
          this.snackBar.open('Code introuvable', 'Fermer', { duration: 3000 });
          this.loading.set(false);
          return;
        }
        this.orderService.redeemOrder(match.id).subscribe({
          next: (order) => {
            this.lastOrder.set(order);
            this.code = '';
            this.loading.set(false);
            this.snackBar.open('Commande validee', 'OK', { duration: 2000 });
          },
          error: () => {
            this.snackBar.open('Erreur de validation', 'Fermer', { duration: 3000 });
            this.loading.set(false);
          },
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
