import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferences } from '../entities/preferences.entity';
import { Favorite } from '../entities/favorite.entity';
import { IdentityQueryDto, UpdatePreferencesDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserPreferences) private prefsRepo: Repository<UserPreferences>,
    @InjectRepository(Favorite) private favRepo: Repository<Favorite>,
  ) {}

  private assertIdentity(query: IdentityQueryDto) {
    if (!query.userId && !query.sessionId) {
      throw new BadRequestException('userId ou sessionId requis');
    }
    return query;
  }

  async getPreferences(query: IdentityQueryDto) {
    this.assertIdentity(query);
    const prefs = await this.findOrCreatePrefs(query);
    return this.formatPrefs(prefs);
  }

  async updatePreferences(query: IdentityQueryDto, dto: UpdatePreferencesDto) {
    this.assertIdentity(query);
    const prefs = await this.findOrCreatePrefs(query);
    Object.assign(prefs, dto);
    const saved = await this.prefsRepo.save(prefs);
    return this.formatPrefs(saved);
  }

  async getFavorites(query: IdentityQueryDto) {
    this.assertIdentity(query);
    const where = query.userId
      ? { userId: query.userId }
      : { sessionId: query.sessionId! };
    const favorites = await this.favRepo.find({ where, order: { createdAt: 'DESC' } });
    return {
      data: favorites.map((f) => ({
        productId: f.productId,
        addedAt: f.createdAt.toISOString(),
      })),
      total: favorites.length,
    };
  }

  async toggleFavorite(query: IdentityQueryDto, productId: string) {
    this.assertIdentity(query);
    const where = query.userId
      ? { userId: query.userId, productId }
      : { sessionId: query.sessionId!, productId };

    const existing = await this.favRepo.findOne({ where });
    if (existing) {
      await this.favRepo.remove(existing);
      return { isFavorite: false, productId };
    }

    await this.favRepo.save(this.favRepo.create({
      userId: query.userId ?? null,
      sessionId: query.sessionId ?? null,
      productId,
    }));
    return { isFavorite: true, productId };
  }

  private async findOrCreatePrefs(query: IdentityQueryDto) {
    let prefs = await this.prefsRepo.findOne({
      where: query.userId
        ? { userId: query.userId }
        : { sessionId: query.sessionId! },
    });
    if (!prefs) {
      prefs = this.prefsRepo.create({
        userId: query.userId ?? null,
        sessionId: query.sessionId ?? null,
      });
      prefs = await this.prefsRepo.save(prefs);
    }
    return prefs;
  }

  private formatPrefs(prefs: UserPreferences) {
    return {
      id: prefs.id,
      userId: prefs.userId,
      sessionId: prefs.sessionId,
      completedOnboarding: prefs.completedOnboarding,
      domains: prefs.domains ?? [],
      subcategories: prefs.subcategories ?? [],
      budgetMin: prefs.budgetMin != null ? Number(prefs.budgetMin) : null,
      budgetMax: prefs.budgetMax != null ? Number(prefs.budgetMax) : null,
      city: prefs.city,
      radiusKm: Number(prefs.radiusKm),
      preferredMode: prefs.preferredMode,
      theme: prefs.theme,
      currency: prefs.currency,
      notificationsEnabled: prefs.notificationsEnabled,
      lat: prefs.lat != null ? Number(prefs.lat) : null,
      lng: prefs.lng != null ? Number(prefs.lng) : null,
      updatedAt: prefs.updatedAt,
    };
  }
}
