import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { QrScannerService } from '../../../core/services/qr-scanner.service';
import { SellerDataService } from '../../../core/services/seller-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Order } from '../../../core/models';
import { evaluateScan, ScanOutcome } from '../../../core/utils/qr.util';
import { formatDate, formatMoney } from '../../../core/utils/format.util';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [FormsModule, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Scanner un code de retrait</h1>
          <p>
            <mat-icon>storefront</mat-icon>
            {{ sellerData.storeName() }} · {{ sellerData.pendingCount() }} code(s) en attente
          </p>
        </div>
        <div class="head-actions">
          <a routerLink="/seller/queue" class="btn-outline">
            <mat-icon>checklist</mat-icon> Voir la file
          </a>
          <button type="button" class="btn-outline" (click)="toggleCamera()">
            <mat-icon>{{ cameraOn() ? 'videocam_off' : 'videocam' }}</mat-icon>
            {{ cameraOn() ? 'Arrêter la caméra' : 'Activer la caméra' }}
          </button>
        </div>
      </header>

      <div class="grid">
        <section class="card camera-card">
          <div class="card-head">
            <h2>Caméra</h2>
            <p>Cadrez le code QR présenté par le client</p>
          </div>
          <div class="camera-view">
            <video #videoEl playsinline muted></video>
            <canvas #canvasEl class="hidden"></canvas>
            @if (!cameraRunning()) {
              <div class="camera-off">
                <mat-icon>qr_code_2</mat-icon>
                <p>{{ cameraError() ?? 'Caméra inactive' }}</p>
              </div>
            } @else {
              <div class="scan-frame"></div>
            }
          </div>
        </section>

        <div class="side">
          <section class="card">
            <div class="card-head">
              <h2>Saisie manuelle</h2>
              <p>Chemin de secours si la caméra est indisponible</p>
            </div>
            <div class="manual-row">
              <input
                class="input-field mono"
                [(ngModel)]="manual"
                placeholder="BK-XXXXXX"
                aria-label="Référence du code"
                (keyup.enter)="verifyManual()"
              />
              <button type="button" class="btn-primary" [disabled]="!manual.trim()" (click)="verifyManual()">
                <mat-icon>keyboard</mat-icon> Vérifier
              </button>
            </div>
            @if (cameraError() && cameraOn()) {
              <p class="camera-warn">
                <mat-icon>warning</mat-icon>
                {{ cameraError() }}
              </p>
            }
          </section>

          <section class="card">
            <div class="card-head">
              <h2>Résultat du scan</h2>
            </div>

            @if (!outcome()) {
              <p class="empty-result">Aucun code lu pour le moment. Le résultat s'affichera ici avant confirmation.</p>
            } @else if (outcome()!.status === 'unknown') {
              <div class="outcome error">
                <mat-icon>block</mat-icon>
                <div>
                  <strong>Code inconnu</strong>
                  <p>Aucune commande ne correspond à ce code.</p>
                </div>
              </div>
            } @else if (outcome()!.status === 'other_store') {
              <div class="outcome warn">
                <mat-icon>storefront</mat-icon>
                <div>
                  <strong>Autre boutique</strong>
                  <p>Ce retrait concerne {{ scanOrder()?.storeName }}. Il ne peut pas être validé ici.</p>
                </div>
              </div>
            } @else if (outcome()!.status === 'already') {
              <div class="outcome neutral">
                <mat-icon>check_circle</mat-icon>
                <div>
                  <strong>Déjà retiré</strong>
                  <p>Validé le {{ scanOrder()?.redeemedAt ? formatDate(scanOrder()!.redeemedAt!, true) : '—' }}.</p>
                </div>
              </div>
            } @else if (outcome()!.status === 'expired') {
              <div class="outcome error">
                <mat-icon>schedule</mat-icon>
                <div>
                  <strong>Code expiré</strong>
                  <p>Expiré le {{ formatDate(scanOrder()?.expiresAt ?? scanOrder()!.createdAt, true) }}. Le client doit repasser commande.</p>
                </div>
              </div>
            } @else if (outcome()!.status === 'valid') {
              @if (scanOrder(); as order) {
                <div class="valid-block">
                  <div class="valid-head">
                    <div>
                      <p class="ref">{{ order.reference ?? order.pickupCode }}</p>
                      <p class="meta">{{ order.customerName }} · {{ order.customerPhone }}</p>
                    </div>
                    <span class="badge success">Valide</span>
                  </div>
                  <ul class="lines">
                    @for (item of order.items; track item.productId) {
                      <li>
                        <span>{{ item.quantity }} × {{ item.product?.name ?? 'Article' }}</span>
                        <span>{{ formatMoney((item.unitPrice ?? item.product?.price ?? 0) * item.quantity) }}</span>
                      </li>
                    }
                  </ul>
                  <div class="total-row">
                    <span>Total encaissé</span>
                    <strong>{{ formatMoney(order.total) }}</strong>
                  </div>
                  @if (!theme.settings().scannerAutoConfirm) {
                    <div class="valid-actions">
                      <button type="button" class="btn-primary full" [disabled]="confirming()" (click)="confirm()">
                        <mat-icon>check_circle</mat-icon> Confirmer la remise
                      </button>
                      <button type="button" class="btn-ghost" (click)="clearOutcome()">Annuler</button>
                    </div>
                  } @else {
                    <p class="auto-note">Validation automatique activée dans les paramètres.</p>
                  }
                </div>
              }
            }
          </section>
        </div>
      </div>

      @if (sellerData.pendingOrders().length) {
        <section class="card pending-section">
          <div class="card-head row">
            <div>
              <h2>Prochains retraits</h2>
              <p>{{ sellerData.pendingCount() }} en attente · {{ formatMoney(sellerData.pendingTotal()) }}</p>
            </div>
            <a routerLink="/seller/queue" class="link">Tout voir</a>
          </div>
          <ul class="pending-list">
            @for (order of sellerData.pendingOrders().slice(0, 4); track order.id) {
              <li>
                <span class="ref">{{ order.reference ?? order.pickupCode }}</span>
                <span class="meta">{{ order.customerName }}</span>
                <span class="amount">{{ formatMoney(order.total) }}</span>
              </li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 64rem; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding-bottom: 24px; }
    .page-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 12px; }
    h1 { margin: 0; font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; }
    .page-head p { display: flex; align-items: center; gap: 6px; margin: 4px 0 0; font-size: 14px; color: rgb(var(--muted)); }
    .page-head p mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .head-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .grid { display: grid; gap: 20px; }
    @media (min-width: 1024px) { .grid { grid-template-columns: 1fr 1fr; } }
    .side { display: flex; flex-direction: column; gap: 20px; }
    .card { padding: 0; overflow: hidden; }
    .card-head { padding: 16px 16px 0; }
    .card-head.row { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px; }
    .card-head h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .card-head p { margin: 4px 0 0; font-size: 13px; color: rgb(var(--muted)); }
    .camera-view {
      position: relative; aspect-ratio: 4 / 3; background: #0f172a; margin-top: 12px;
      overflow: hidden; border-radius: 0 0 12px 12px;
    }
    .camera-view video { width: 100%; height: 100%; object-fit: cover; }
    .hidden { display: none; }
    .camera-off {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 14px;
    }
    .camera-off mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .scan-frame {
      pointer-events: none; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    }
    .scan-frame::after {
      content: ''; width: 192px; height: 192px; border-radius: 12px; border: 2px solid rgba(255,255,255,0.8);
      box-shadow: 0 0 0 9999px rgba(15,23,42,0.45);
    }
    .manual-row { display: flex; gap: 8px; padding: 16px; }
    .manual-row .input-field { flex: 1; }
    .camera-warn {
      display: flex; align-items: center; gap: 6px; margin: 0 16px 16px;
      font-size: 12px; color: #b45309;
    }
    .camera-warn mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .input-field.mono { font-family: ui-monospace, monospace; text-transform: uppercase; }
    .empty-result { padding: 24px 16px; text-align: center; font-size: 14px; color: rgb(var(--muted)); margin: 0; }
    .outcome { display: flex; gap: 12px; padding: 16px; margin: 0 16px 16px; border-radius: 8px; }
    .outcome mat-icon { flex-shrink: 0; }
    .outcome strong { display: block; font-size: 14px; }
    .outcome p { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .outcome.error { background: rgba(244,63,94,0.1); }
    .outcome.error mat-icon { color: #be123c; }
    .outcome.warn { background: rgba(245,158,11,0.1); }
    .outcome.warn mat-icon { color: #b45309; }
    .outcome.neutral { background: rgb(var(--surface-2)); }
    .valid-block { padding: 16px; }
    .valid-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .ref { margin: 0; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 600; }
    .meta { margin: 4px 0 0; font-size: 12px; color: rgb(var(--muted)); }
    .badge.success { padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: rgba(5,150,105,0.15); color: #047857; }
    .lines { list-style: none; margin: 12px 0 0; padding: 0; border: 1px solid rgb(var(--line)); border-radius: 8px; overflow: hidden; }
    .lines li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; font-size: 14px; border-top: 1px solid rgb(var(--line)); }
    .lines li:first-child { border-top: none; }
    .lines li span:last-child { color: rgb(var(--muted)); flex-shrink: 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 14px; }
    .total-row strong { font-size: 18px; }
    .valid-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .auto-note { margin: 12px 0 0; font-size: 12px; color: rgb(var(--muted)); text-align: center; }
    .btn-primary.full { width: 100%; justify-content: center; }
    .btn-primary, .btn-outline, .btn-ghost {
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
      border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; text-decoration: none;
    }
    .btn-primary { background: rgb(var(--accent)); color: white; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); color: rgb(var(--ink)); }
    .btn-ghost { background: none; color: rgb(var(--muted)); justify-content: center; }
    .pending-section .pending-list { list-style: none; margin: 0; padding: 0 16px 16px; }
    .pending-list li {
      display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: center;
      padding: 10px 0; border-top: 1px solid rgb(var(--line)); font-size: 13px;
    }
    .pending-list li:first-child { border-top: none; }
    .pending-list .amount { font-weight: 600; text-align: right; }
    .link { font-size: 13px; font-weight: 600; color: rgb(var(--accent)); text-decoration: none; }
  `],
})
export class ScannerComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly sellerData = inject(SellerDataService);
  readonly theme = inject(ThemeService);
  private readonly orderService = inject(OrderService);
  private readonly qrScanner = inject(QrScannerService);
  private readonly snackBar = inject(MatSnackBar);

  readonly formatDate = formatDate;
  readonly formatMoney = formatMoney;

  manual = '';
  cameraOn = signal(false);
  cameraRunning = signal(false);
  cameraError = signal<string | null>(null);
  outcome = signal<ScanOutcome | null>(null);
  scanOrder = signal<Order | null>(null);
  confirming = signal(false);

  private refreshTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.sellerData.refreshOrders().subscribe();
    this.refreshTimer = setInterval(() => this.sellerData.refreshOrders().subscribe(), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.stopCamera();
  }

  async toggleCamera(): Promise<void> {
    if (this.cameraOn()) {
      this.stopCamera();
      this.cameraOn.set(false);
      return;
    }
    this.cameraError.set(null);
    this.cameraOn.set(true);
    setTimeout(() => this.startCamera(), 80);
  }

  verifyManual(): void {
    if (!this.manual.trim()) return;
    this.handleScan(this.manual.trim());
  }

  confirm(): void {
    const result = this.outcome();
    if (!result || result.status !== 'valid') return;
    this.redeem(result.order);
  }

  clearOutcome(): void {
    this.outcome.set(null);
    this.scanOrder.set(null);
  }

  private async startCamera(): Promise<void> {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas) return;
    try {
      await this.qrScanner.start(video, canvas, (value) => this.handleScan(value));
      this.cameraRunning.set(true);
      this.cameraError.set(null);
    } catch {
      this.cameraError.set('Accès caméra refusé ou indisponible. Utilisez la saisie manuelle.');
      this.cameraRunning.set(false);
      this.cameraOn.set(false);
    }
  }

  private stopCamera(): void {
    this.qrScanner.stop();
    this.cameraRunning.set(false);
  }

  private handleScan(raw: string): void {
    const storeId = this.sellerData.storeId();
    const orders = this.sellerData.storeOrders();
    const result = evaluateScan(raw, orders, storeId);
    this.outcome.set(result);
    this.scanOrder.set(result.status !== 'unknown' ? result.order : null);

    if (result.status === 'valid') {
      this.theme.playScannerFeedback();
      if (this.theme.settings().scannerAutoConfirm) {
        this.redeem(result.order, true);
        this.stopCamera();
        this.cameraOn.set(false);
      }
    }
  }

  private redeem(order: Order, auto = false): void {
    this.confirming.set(true);
    this.orderService.redeemOrder(order.id).subscribe({
      next: () => {
        const label = order.reference ?? order.pickupCode;
        this.snackBar.open(
          auto ? 'Retrait confirmé automatiquement' : 'Retrait confirmé',
          `${label} · ${formatMoney(order.total)}`,
          { duration: 3000 },
        );
        this.manual = '';
        this.clearOutcome();
        this.confirming.set(false);
        this.sellerData.refreshOrders().subscribe();
      },
      error: () => {
        this.snackBar.open('Erreur', 'Fermer', { duration: 3000 });
        this.confirming.set(false);
      },
    });
  }
}
