import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Chargement...</p>
    </div>
  `,
  styles: [`
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
      color: var(--text-muted);
    }
    p { margin: 0; font-size: 0.875rem; }
  `],
})
export class LoadingSpinnerComponent {}
