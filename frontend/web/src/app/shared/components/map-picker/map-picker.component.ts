import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [MatIconModule, DecimalPipe],
  template: `
    <div class="picker">
      <p class="label">Position sur la carte</p>
      <div
        class="map"
        (click)="onMapClick($event)"
        role="img"
        [attr.aria-label]="'Carte centrée sur ' + lat + ', ' + lng"
      >
        <img [src]="mapUrl" alt="" loading="lazy" referrerpolicy="no-referrer" />
        <mat-icon class="pin">location_on</mat-icon>
      </div>
      <p class="hint">
        Cliquez la carte pour déplacer le repère · {{ lat | number:'1.5-5' }}, {{ lng | number:'1.5-5' }}
      </p>
      <div class="nudges">
        <button type="button" class="nudge" (click)="nudge(0.002, 0)" aria-label="Nord">
          <mat-icon>north</mat-icon>
        </button>
        <button type="button" class="nudge" (click)="nudge(-0.002, 0)" aria-label="Sud">
          <mat-icon>south</mat-icon>
        </button>
        <button type="button" class="nudge" (click)="nudge(0, -0.002)" aria-label="Ouest">
          <mat-icon>west</mat-icon>
        </button>
        <button type="button" class="nudge" (click)="nudge(0, 0.002)" aria-label="Est">
          <mat-icon>east</mat-icon>
        </button>
        <button type="button" class="recenter" (click)="pick.emit({ lat, lng })">Recentrer</button>
      </div>
    </div>
  `,
  styles: [`
    .picker { display: flex; flex-direction: column; gap: 8px; }
    .label { margin: 0; font-size: 13px; font-weight: 700; }
    .map {
      position: relative; height: 220px; border-radius: 14px; overflow: hidden;
      border: 1px solid rgb(var(--line)); cursor: crosshair; background: rgb(var(--surface-2));
    }
    .map img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .pin {
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -90%);
      color: #dc2626; font-size: 36px; width: 36px; height: 36px;
      filter: drop-shadow(0 2px 4px rgb(0 0 0 / 0.35));
      pointer-events: none;
    }
    .hint { margin: 0; font-size: 12px; color: rgb(var(--muted)); }
    .nudges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .nudge {
      width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgb(var(--line));
      background: rgb(var(--surface)); display: grid; place-items: center; cursor: pointer;
    }
    .nudge mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .recenter {
      margin-left: auto; border: none; background: transparent;
      color: rgb(var(--accent)); font-weight: 700; font-size: 12px; cursor: pointer;
    }
  `],
})
export class MapPickerComponent {
  @Input({ required: true }) lat!: number;
  @Input({ required: true }) lng!: number;
  @Output() readonly pick = new EventEmitter<{ lat: number; lng: number }>();

  private readonly span = 0.045;

  get mapUrl(): string {
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${this.lat},${this.lng}&zoom=14&size=640x360&maptype=mapnik&markers=${this.lat},${this.lng},red-pushpin`;
  }

  onMapClick(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const dx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const dy = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const lng = this.lng - this.span + dx * this.span * 2;
    const lat = this.lat + this.span - dy * this.span * 2;
    this.pick.emit({ lat, lng });
  }

  nudge(dLat: number, dLng: number): void {
    this.pick.emit({ lat: this.lat + dLat, lng: this.lng + dLng });
  }
}
