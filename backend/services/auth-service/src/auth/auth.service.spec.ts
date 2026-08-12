import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

describe('AuthService (unit)', () => {
  let service: AuthService;

  const usersRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const tokensRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const jwtService = { sign: jest.fn().mockReturnValue('access-token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: tokensRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('register rejette un email dupliqué', async () => {
    usersRepo.findOne.mockResolvedValue({ id: '1', email: 'a@test.com' });
    await expect(
      service.register({ email: 'a@test.com', password: 'secret1', role: 'client' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login rejette des identifiants invalides', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@test.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register crée un utilisateur et retourne des tokens', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    usersRepo.create.mockImplementation((u) => u);
    usersRepo.save.mockImplementation(async (u) => ({ ...u, id: 'uuid-1' }));
    tokensRepo.create.mockImplementation((t) => t);
    tokensRepo.save.mockResolvedValue({});

    const result = await service.register({
      email: 'new@test.com',
      password: 'secret1',
      role: 'client',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.user.email).toBe('new@test.com');
  });
});
