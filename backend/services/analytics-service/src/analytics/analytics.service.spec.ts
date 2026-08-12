import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { OrderSnapshot, StoreSnapshot, SellerSnapshot, DailyMetric } from '../entities/analytics.entity';

describe('AnalyticsService (unit)', () => {
  let service: AnalyticsService;
  const orderRepo = { find: jest.fn(), createQueryBuilder: jest.fn() };
  const storeRepo = { find: jest.fn() };
  const sellerRepo = { find: jest.fn() };
  const metricsRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(OrderSnapshot), useValue: orderRepo },
        { provide: getRepositoryToken(StoreSnapshot), useValue: storeRepo },
        { provide: getRepositoryToken(SellerSnapshot), useValue: sellerRepo },
        { provide: getRepositoryToken(DailyMetric), useValue: metricsRepo },
      ],
    }).compile();
    service = module.get(AnalyticsService);
  });

  it('getOverview calcule CA et conversion', async () => {
    orderRepo.find.mockResolvedValue([
      { status: 'redeemed', total: 1000 },
      { status: 'pending', total: 500 },
    ]);
    storeRepo.find.mockResolvedValue([{ status: 'active' }, { status: 'paused' }]);
    sellerRepo.find.mockResolvedValue([{ status: 'active' }]);

    const overview = await service.getOverview();
    expect(overview.totalRevenue).toBe(1000);
    expect(overview.conversionRate).toBe(50);
    expect(overview.storeCount).toBe(1);
  });

  it('getMonitoring retourne un statut global', async () => {
    const monitoring = await service.getMonitoring();
    expect(monitoring.globalStatus).toBe('operational');
    expect(monitoring.services.length).toBeGreaterThan(0);
  });
});
