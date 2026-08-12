import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserPreferences } from '../entities/preferences.entity';
import { Favorite } from '../entities/favorite.entity';

describe('UsersService (unit)', () => {
  let service: UsersService;
  const prefsRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const favRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserPreferences), useValue: prefsRepo },
        { provide: getRepositoryToken(Favorite), useValue: favRepo },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  it('exige userId ou sessionId', async () => {
    await expect(service.getPreferences({})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('crée des préférences par défaut pour une session', async () => {
    prefsRepo.findOne.mockResolvedValue(null);
    prefsRepo.create.mockImplementation((p) => p);
    prefsRepo.save.mockImplementation(async (p) => ({ ...p, id: 'pref-1', updatedAt: new Date() }));

    const result = await service.getPreferences({ sessionId: 'sess-abc' });
    expect(result.sessionId).toBe('sess-abc');
    expect(result.completedOnboarding).toBe(false);
  });
});
