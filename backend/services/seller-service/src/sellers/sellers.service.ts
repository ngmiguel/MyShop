import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seller, SellerStatus } from '../entities/seller.entity';
import { AuthClient } from '../common/clients/auth.client';
import { StoreClient } from '../common/clients/store.client';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { SellerQueryDto } from './dto/seller-query.dto';
import { JwtPayload } from '../common/interfaces';

@Injectable()
export class SellersService {
  constructor(
    @InjectRepository(Seller) private sellersRepo: Repository<Seller>,
    private authClient: AuthClient,
    private storeClient: StoreClient,
  ) {}

  async register(dto: RegisterSellerDto) {
    const existing = await this.sellersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const validation = await this.storeClient.validateAccessCode(dto.accessCode, dto.storeId);
    const storeId = validation.storeId;

    const count = await this.sellersRepo.count({ where: { storeId } });
    if (validation.maxSellers && count >= validation.maxSellers) {
      throw new BadRequestException('Nombre maximum de vendeurs atteint pour cette boutique');
    }

    const status: SellerStatus = validation.autoApproveSellers ? 'active' : 'pending';

    const auth = await this.authClient.register({
      email: dto.email,
      password: dto.password,
      role: 'vendeur',
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      storeId,
    });

    const seller = this.sellersRepo.create({
      userId: auth.user.id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      birthDate: dto.birthDate,
      idType: dto.idType,
      idNumber: dto.idNumber,
      storeId,
      position: dto.position,
      shift: dto.shift,
      status,
    });
    await this.sellersRepo.save(seller);

    return {
      ...auth,
      seller: this.sanitizeSeller(seller),
    };
  }

  async login(dto: LoginSellerDto) {
    let seller = await this.sellersRepo.findOne({ where: { email: dto.email } });
    if (!seller) throw new NotFoundException('Profil vendeur introuvable');

    let auth;
    try {
      auth = await this.authClient.login(dto.email, dto.password);
    } catch (err) {
      if (seller.userId) throw err;
      auth = await this.authClient.register({
        email: dto.email,
        password: dto.password,
        role: 'vendeur',
        firstName: seller.firstName,
        lastName: seller.lastName,
        phone: seller.phone,
        storeId: seller.storeId,
      });
      seller.userId = auth.user.id;
      await this.sellersRepo.save(seller);
    }

    if (seller.status === 'suspended') {
      throw new ForbiddenException('Compte vendeur suspendu');
    }
    if (seller.status === 'pending') {
      throw new ForbiddenException('Compte en attente d\'approbation manager');
    }

    return {
      ...auth,
      seller: this.sanitizeSeller(seller),
    };
  }

  async findAll(query: SellerQueryDto) {
    const qb = this.sellersRepo.createQueryBuilder('seller');
    if (query.storeId) {
      qb.andWhere('seller.store_id = :storeId', { storeId: query.storeId });
    }
    if (query.status) {
      qb.andWhere('seller.status = :status', { status: query.status });
    }
    qb.orderBy('seller.joined_at', 'DESC');
    const sellers = await qb.getMany();
    const data = sellers.map((s) => this.sanitizeSeller(s));
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
    };
  }

  async findOne(id: string) {
    const seller = await this.sellersRepo.findOne({ where: { id } });
    if (!seller) throw new NotFoundException('Vendeur introuvable');
    return this.sanitizeSeller(seller);
  }

  async getPerformance(id: string, user?: JwtPayload) {
    const seller = await this.sellersRepo.findOne({ where: { id } });
    if (!seller) throw new NotFoundException('Vendeur introuvable');

    if (user?.role === 'vendeur' && seller.userId !== user.sub) {
      throw new ForbiddenException('Accès refusé');
    }

    return {
      sellerId: seller.id,
      storeId: seller.storeId,
      salesCount: Number(seller.salesCount),
      revenue: Number(seller.revenue),
      rating: Number(seller.rating),
      ratingCount: seller.ratingCount,
      avgHandoverMinutes: Number(seller.avgHandoverMinutes),
      monthlyTarget: Number(seller.monthlyTarget),
      targetProgress: seller.monthlyTarget > 0
        ? Math.round((Number(seller.revenue) / Number(seller.monthlyTarget)) * 100)
        : 0,
    };
  }

  async approve(id: string) {
    return this.updateStatus(id, 'active', ['pending']);
  }

  async suspend(id: string) {
    return this.updateStatus(id, 'suspended', ['active', 'pending']);
  }

  async activate(id: string) {
    return this.updateStatus(id, 'active', ['suspended']);
  }

  async seed() {
    const demoStoreId = process.env.DEMO_STORE_ID || '11111111-1111-1111-1111-111111111111';
    const demos = [
      {
        firstName: 'Kofi', lastName: 'Mensah', email: 'kofi.vendeur@myshop.app',
        phone: '+2250700000001', position: 'Caissier', shift: 'matin',
        status: 'active' as SellerStatus, rating: 4.5, ratingCount: 12,
        salesCount: 48, revenue: 1250000, avgHandoverMinutes: 8.5, monthlyTarget: 2000000,
      },
      {
        firstName: 'Aïcha', lastName: 'Traoré', email: 'aicha.vendeur@myshop.app',
        phone: '+2250700000002', position: 'Conseillère', shift: 'après-midi',
        status: 'active' as SellerStatus, rating: 4.8, ratingCount: 24,
        salesCount: 72, revenue: 2100000, avgHandoverMinutes: 6.2, monthlyTarget: 2500000,
      },
      {
        firstName: 'Jean', lastName: 'Kouassi', email: 'jean.vendeur@myshop.app',
        phone: '+2250700000003', position: 'Stagiaire', shift: 'soir',
        status: 'pending' as SellerStatus, rating: 0, ratingCount: 0,
        salesCount: 0, revenue: 0, avgHandoverMinutes: 0, monthlyTarget: 500000,
      },
    ];

    const created: ReturnType<typeof this.sanitizeSeller>[] = [];
    for (const demo of demos) {
      const exists = await this.sellersRepo.findOne({ where: { email: demo.email } });
      if (exists) {
        created.push(this.sanitizeSeller(exists));
        continue;
      }
      const seller = this.sellersRepo.create({ ...demo, storeId: demoStoreId });
      await this.sellersRepo.save(seller);
      created.push(this.sanitizeSeller(seller));
    }
    return { message: '3 vendeurs démo créés ou déjà existants', sellers: created };
  }

  private async updateStatus(id: string, status: SellerStatus, allowedFrom: SellerStatus[]) {
    const seller = await this.sellersRepo.findOne({ where: { id } });
    if (!seller) throw new NotFoundException('Vendeur introuvable');
    if (!allowedFrom.includes(seller.status)) {
      throw new BadRequestException(`Transition impossible depuis le statut "${seller.status}"`);
    }
    seller.status = status;
    await this.sellersRepo.save(seller);
    return this.sanitizeSeller(seller);
  }

  private sanitizeSeller(seller: Seller) {
    return {
      id: seller.id,
      userId: seller.userId,
      firstName: seller.firstName,
      lastName: seller.lastName,
      email: seller.email,
      phone: seller.phone,
      avatarUrl: seller.avatarUrl,
      birthDate: seller.birthDate,
      idType: seller.idType,
      idNumber: seller.idNumber,
      storeId: seller.storeId,
      position: seller.position,
      shift: seller.shift,
      status: seller.status,
      rating: Number(seller.rating),
      ratingCount: seller.ratingCount,
      salesCount: seller.salesCount,
      revenue: Number(seller.revenue),
      avgHandoverMinutes: Number(seller.avgHandoverMinutes),
      monthlyTarget: Number(seller.monthlyTarget),
      joinedAt: seller.joinedAt,
    };
  }
}
