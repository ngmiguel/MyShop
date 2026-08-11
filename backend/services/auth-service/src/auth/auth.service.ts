import {
  Injectable, ConflictException, UnauthorizedException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private tokensRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email déjà utilisé');
    }

    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, this.saltRounds),
      role: dto.role,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      storeId: dto.storeId,
    });

    await this.usersRepo.save(user);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase(), isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const stored = await this.tokensRepo.findOne({
      where: { tokenHash: hash, expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });
    if (!stored?.user) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    await this.tokensRepo.delete(stored.id);
    return this.buildAuthResponse(stored.user);
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId, isActive: true } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return this.sanitizeUser(user);
  }

  async seedManager() {
    const email = (process.env.DEMO_MANAGER_EMAIL || 'manager@myshop.app').toLowerCase();
    const password = process.env.DEMO_MANAGER_PASSWORD || 'Manager2026!';

    let user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      user = this.usersRepo.create({
        email,
        passwordHash: await bcrypt.hash(password, this.saltRounds),
        role: 'manager',
        firstName: 'Admin',
        lastName: 'MyShop',
      });
      await this.usersRepo.save(user);
    }

    return {
      message: 'Compte manager prêt',
      email,
      password: '*** (voir DEMO_MANAGER_PASSWORD)',
      user: this.sanitizeUser(user),
    };
  }

  private async buildAuthResponse(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      storeId: user.storeId ?? undefined,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresAt = this.parseExpiry(refreshExpires);

    await this.tokensRepo.save(this.tokensRepo.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    }));

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      storeId: user.storeId,
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(value: string): Date {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return new Date(Date.now() + amount * (multipliers[unit] ?? 86400000));
  }
}
