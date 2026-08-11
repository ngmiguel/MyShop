import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus } from '../entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreQueryDto } from './dto/store-query.dto';
import { RegenerateAccessCodeDto } from './dto/regenerate-access-code.dto';
import {
  computeAccessCodeExpiry,
  formatAccessCodeWithPrefix,
  generateAccessCode,
} from '../common/utils/access-code.util';
import { AuthUser } from '../auth/auth.types';

const DEFAULT_HOURS = [
  { day: 'Lundi', open: '08:00', close: '18:30', closed: false },
  { day: 'Mardi', open: '08:00', close: '18:30', closed: false },
  { day: 'Mercredi', open: '08:00', close: '18:30', closed: false },
  { day: 'Jeudi', open: '08:00', close: '18:30', closed: false },
  { day: 'Vendredi', open: '08:00', close: '18:30', closed: false },
  { day: 'Samedi', open: '08:00', close: '18:30', closed: false },
  { day: 'Dimanche', open: '08:00', close: '18:30', closed: true },
];

const ABIDJAN_DEMO_STORES: Array<Omit<CreateStoreDto, 'city'> & { code: string }> = [
  {
    name: 'Sankofa Mode',
    legalName: 'Sankofa Mode SARL',
    tagline: 'Le wax revisité, tous les jours.',
    shortDescription: 'Mode, wax et artisanat ivoirien.',
    description:
      'Prêt-à-porter, tissus et objets de maison inspirés des textiles traditionnels. Confection sur mesure en 48h.',
    categories: ['style', 'art', 'beaute'],
    mainCategory: 'style',
    subcategories: ['Wax', 'Sur-mesure', 'Artisanat'],
    address: '14 Rue des Artisans, Plateau',
    region: 'Lagunes',
    landmark: 'Face à la pharmacie du Plateau',
    lat: 5.3242,
    lng: -4.0198,
    phone: '+225 07 88 12 44 90',
    email: 'contact@sankofa.store',
    paymentMethods: ['mobile_money', 'card', 'cash'],
    delivery: true,
    pickup: true,
    capacity: 12,
    maxSellers: 12,
    foundedYear: 2018,
    status: 'active',
    code: 'SANKOFA',
  },
  {
    name: 'Volt Électronique',
    legalName: 'Volt Électronique CI',
    tagline: 'La tech testée avant la vente.',
    shortDescription: 'High-tech garantie et réparation express.',
    description:
      'Ordinateurs, smartphones, audio et accessoires garantis 12 mois. Atelier de réparation express sur place.',
    categories: ['tech', 'energie', 'services'],
    mainCategory: 'tech',
    subcategories: ['Garantie 12 mois', 'Réparation', 'Reconditionné'],
    address: "Immeuble Alpha, Bd de l'Indépendance",
    region: 'Lagunes',
    landmark: 'Immeuble Alpha, rez-de-chaussée',
    lat: 5.3378,
    lng: -4.0269,
    phone: '+225 05 44 90 12 33',
    email: 'hello@volt.ci',
    paymentMethods: ['mobile_money', 'card', 'transfer'],
    delivery: true,
    pickup: true,
    capacity: 20,
    maxSellers: 20,
    foundedYear: 2019,
    status: 'active',
    code: 'VOLT',
  },
  {
    name: 'Grain & Terre',
    legalName: 'Grain & Terre SARL',
    tagline: 'Torréfaction locale, circuit court.',
    shortDescription: 'Café, cacao et épicerie fine.',
    description:
      'Épicerie fine : cafés torréfiés sur place, cacao, épices et produits fermiers de la région.',
    categories: ['agro', 'agriculture'],
    mainCategory: 'agro',
    subcategories: ['Bio', 'Circuit court', 'Torréfaction'],
    address: '3 Marché Cocody Angré',
    region: 'Lagunes',
    landmark: 'Marché Cocody Angré',
    lat: 5.3801,
    lng: -3.9866,
    phone: '+225 01 22 65 78 10',
    email: 'bonjour@grainetterre.ci',
    paymentMethods: ['mobile_money', 'cash'],
    delivery: false,
    pickup: true,
    capacity: 8,
    maxSellers: 8,
    foundedYear: 2017,
    status: 'active',
    code: 'GRAIN',
  },
  {
    name: 'Baobab Soins',
    legalName: 'Baobab Soins Naturels',
    tagline: 'Cosmétique naturelle, formulée ici.',
    shortDescription: 'Soins au karité et baobab.',
    description:
      'Huiles, beurres et sérums à base de karité et de baobab. Ateliers de formulation tous les samedis.',
    categories: ['beaute', 'style'],
    mainCategory: 'beaute',
    subcategories: ['Naturel', 'Karité', 'Atelier'],
    address: '27 Avenue Marchand, Treichville',
    region: 'Lagunes',
    landmark: 'Avenue Marchand',
    lat: 5.2937,
    lng: -4.0083,
    phone: '+225 07 10 04 55 21',
    email: 'soin@baobab.ci',
    paymentMethods: ['mobile_money', 'cash'],
    delivery: true,
    pickup: true,
    capacity: 8,
    maxSellers: 8,
    foundedYear: 2020,
    status: 'active',
    code: 'BAOBAB',
  },
  {
    name: 'Auto Ivoire Motors',
    legalName: 'Auto Ivoire Motors SA',
    tagline: 'Rouler sûr, payer juste.',
    shortDescription: 'Véhicules contrôlés et pièces détachées.',
    description:
      'Véhicules d’occasion contrôlés, motos neuves, pièces détachées et pneumatiques. Essai possible sur rendez-vous.',
    categories: ['vehicules', 'services'],
    mainCategory: 'vehicules',
    subcategories: ['Occasion contrôlée', 'Financement', 'Garantie 3 mois'],
    address: 'Zone 4, Bd VGE',
    region: 'Lagunes',
    landmark: 'Boulevard VGE, Zone 4',
    lat: 5.2841,
    lng: -3.9925,
    phone: '+225 27 21 44 78 00',
    email: 'ventes@autoivoire.ci',
    paymentMethods: ['transfer', 'card', 'cash'],
    delivery: false,
    pickup: true,
    capacity: 15,
    maxSellers: 15,
    foundedYear: 2015,
    status: 'active',
    code: 'AUTOIV',
  },
];

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store) private storesRepo: Repository<Store>,
  ) {}

  async findAll(query: StoreQueryDto, user: AuthUser | null) {
    const isManager = user?.role === 'manager';
    const qb = this.storesRepo.createQueryBuilder('store');

    if (!isManager) {
      qb.andWhere('store.status = :activeStatus', { activeStatus: 'active' });
    } else if (query.status) {
      qb.andWhere('store.status = :status', { status: query.status });
    }

    if (query.city) {
      qb.andWhere('LOWER(store.city) = LOWER(:city)', { city: query.city });
    }

    if (query.category) {
      qb.andWhere(
        '(store.mainCategory = :category OR store.categories @> :categoryJson)',
        {
          category: query.category,
          categoryJson: JSON.stringify([query.category]),
        },
      );
    }

    qb.orderBy('store.createdAt', 'DESC');

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const [stores, total] = await qb.skip(offset).take(limit).getManyAndCount();
    const data = stores.map((store) => this.toResponse(store, isManager));
    return { data, total, page, limit };
  }

  async findOne(id: string, user: AuthUser | null) {
    const store = await this.storesRepo.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const isManager = user?.role === 'manager';
    if (!isManager && store.status !== 'active') {
      throw new NotFoundException('Store not found');
    }

    return this.toResponse(store, isManager);
  }

  async create(dto: CreateStoreDto) {
    const { accessCodeDays, accessCode, ...rest } = dto;
    const ttlDays = accessCodeDays ?? 90;
    const resolvedAccessCode = accessCode
      ?? formatAccessCodeWithPrefix(dto.name.slice(0, 5).replace(/\s/g, ''), 9);

    const store = this.storesRepo.create({
      ...rest,
      accessCode: resolvedAccessCode,
      accessCodeExpiry: computeAccessCodeExpiry(ttlDays),
      hours: dto.hours ?? DEFAULT_HOURS,
      country: dto.country ?? 'CI',
      currency: dto.currency ?? 'XOF',
      status: dto.status ?? 'draft',
    });

    const saved = await this.storesRepo.save(store);
    return this.toResponse(saved, true);
  }

  async update(id: string, dto: UpdateStoreDto) {
    const store = await this.storesRepo.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const { accessCodeDays, ...rest } = dto;
    Object.assign(store, rest);

    if (accessCodeDays !== undefined && dto.accessCode === undefined) {
      store.accessCodeExpiry = computeAccessCodeExpiry(accessCodeDays);
    }

    const saved = await this.storesRepo.save(store);
    return this.toResponse(saved, true);
  }

  async remove(id: string) {
    const store = await this.storesRepo.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    await this.storesRepo.remove(store);
    return { deleted: true, id };
  }

  async regenerateAccessCode(id: string, dto: RegenerateAccessCodeDto) {
    const store = await this.storesRepo.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const length = dto.length ?? 9;
    const days = dto.days ?? 90;
    store.accessCode = generateAccessCode(length);
    store.accessCodeExpiry = computeAccessCodeExpiry(days);

    const saved = await this.storesRepo.save(store);
    return {
      id: saved.id,
      accessCode: saved.accessCode,
      accessCodeExpiry: saved.accessCodeExpiry,
    };
  }

  async validateAccessCode(accessCode: string, storeId?: string) {
    const store = await this.storesRepo
      .createQueryBuilder('store')
      .where('UPPER(store.access_code) = UPPER(:code)', { code: accessCode })
      .getOne();

    if (!store) {
      return { valid: false as const };
    }

    if (store.accessCodeExpiry && store.accessCodeExpiry < new Date()) {
      return { valid: false as const };
    }

    if (store.status !== 'active' && store.status !== 'draft') {
      return { valid: false as const };
    }

    if (storeId && store.id !== storeId) {
      return { valid: false as const, storeId: store.id };
    }

    return {
      valid: true as const,
      storeId: store.id,
      storeName: store.name,
      autoApproveSellers: store.autoApproveSellers,
      maxSellers: store.maxSellers,
    };
  }

  async seed() {
    const count = await this.storesRepo.count();
    if (count > 0) {
      throw new ConflictException('Stores already exist');
    }

    const created: Store[] = [];
    for (const seed of ABIDJAN_DEMO_STORES) {
      const { code, ...data } = seed;
      const store = this.storesRepo.create({
        ...data,
        city: 'Abidjan',
        country: 'CI',
        currency: 'XOF',
        taxRate: 18,
        serviceRadiusKm: 10,
        hours: DEFAULT_HOURS,
        accessCode: formatAccessCodeWithPrefix(code, 9),
        accessCodeExpiry: computeAccessCodeExpiry(90),
        rating: seed.name === 'Sankofa Mode' ? 4.7
          : seed.name === 'Volt Électronique' ? 4.4
          : seed.name === 'Grain & Terre' ? 4.9
          : seed.name === 'Baobab Soins' ? 4.6
          : 4.3,
        reviewCount: seed.name === 'Sankofa Mode' ? 128
          : seed.name === 'Volt Électronique' ? 86
          : seed.name === 'Grain & Terre' ? 213
          : seed.name === 'Baobab Soins' ? 54
          : 97,
      });
      created.push(await this.storesRepo.save(store));
    }

    return {
      seeded: true,
      count: created.length,
      stores: created.map((store) => this.toResponse(store, true)),
    };
  }

  private toResponse(store: Store, includeAccessCode: boolean) {
    const base = {
      id: store.id,
      name: store.name,
      legalName: store.legalName,
      tagline: store.tagline,
      shortDescription: store.shortDescription,
      description: store.description,
      logoUrl: store.logoUrl,
      photos: store.photos ?? [],
      coverIndex: store.coverIndex,
      categories: store.categories ?? [],
      mainCategory: store.mainCategory,
      subcategories: store.subcategories ?? [],
      address: store.address,
      city: store.city,
      region: store.region,
      country: store.country,
      landmark: store.landmark,
      lat: store.lat != null ? Number(store.lat) : null,
      lng: store.lng != null ? Number(store.lng) : null,
      serviceRadiusKm: store.serviceRadiusKm != null ? Number(store.serviceRadiusKm) : null,
      hours: store.hours ?? [],
      phone: store.phone,
      email: store.email,
      paymentMethods: store.paymentMethods ?? [],
      currency: store.currency,
      taxRate: store.taxRate != null ? Number(store.taxRate) : null,
      delivery: store.delivery,
      pickup: store.pickup,
      capacity: store.capacity,
      foundedYear: store.foundedYear,
      legalStatus: store.legalStatus,
      registrationNumber: store.registrationNumber,
      maxSellers: store.maxSellers,
      autoApproveSellers: store.autoApproveSellers,
      status: store.status as StoreStatus,
      rating: store.rating != null ? Number(store.rating) : 0,
      reviewCount: store.reviewCount,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };

    if (includeAccessCode) {
      return {
        ...base,
        accessCode: store.accessCode,
        accessCodeExpiry: store.accessCodeExpiry,
      };
    }

    return base;
  }
}
