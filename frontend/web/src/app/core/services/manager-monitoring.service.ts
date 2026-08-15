import { computed, inject, Injectable, signal } from '@angular/core';
import { EventLevel, MonitoringEvent } from '../data/demo-monitoring';
import { ManagerDataService } from './manager-data.service';

export type MonitoringTabFilter = 'all' | 'open' | 'error';

@Injectable({ providedIn: 'root' })
export class ManagerMonitoringService {
  private readonly data = inject(ManagerDataService);

  readonly tabFilter = signal<MonitoringTabFilter>('open');
  readonly storeFilter = signal('all');
  readonly serviceFilter = signal('all');
  readonly levelFilter = signal<'all' | EventLevel>('all');
  readonly query = signal('');

  readonly stores = signal(this.data.getManagerStores());

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.storeFilter() !== 'all') count += 1;
    if (this.serviceFilter() !== 'all') count += 1;
    if (this.levelFilter() !== 'all') count += 1;
    if (this.query().trim()) count += 1;
    return count;
  });

  resetFilters(): void {
    this.storeFilter.set('all');
    this.serviceFilter.set('all');
    this.levelFilter.set('all');
    this.query.set('');
  }

  storeName(id: string): string {
    return this.stores().find((s) => s.id === id)?.name ?? id;
  }

  matchesBaseFilters(event: MonitoringEvent): boolean {
    const store = this.storeFilter();
    const service = this.serviceFilter();
    const level = this.levelFilter();
    const q = this.query().trim().toLowerCase();

    if (store !== 'all' && event.storeId !== store) return false;
    if (service !== 'all' && event.service !== service) return false;
    if (level !== 'all' && event.level !== level) return false;
    if (q) {
      const haystack = `${event.message} ${event.service} ${event.storeId ? this.storeName(event.storeId) : ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }

  matchesTab(event: MonitoringEvent): boolean {
    const tab = this.tabFilter();
    if (tab === 'open' && event.acknowledged) return false;
    if (tab === 'error' && event.level !== 'error') return false;
    return true;
  }

  filterEvents(events: MonitoringEvent[]): MonitoringEvent[] {
    return events.filter((e) => this.matchesBaseFilters(e) && this.matchesTab(e));
  }

  filterScopedEvents(events: MonitoringEvent[]): MonitoringEvent[] {
    return events.filter((e) => this.matchesBaseFilters(e));
  }
}
