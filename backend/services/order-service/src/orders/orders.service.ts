import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, FindOptionsWhere } from 'typeorm';
import { Order } from '../entities/order.entity';
import { CartService } from '../cart/cart.service';
import { PromoService } from '../promo/promo.service';
import { CheckoutDto, ListOrdersQueryDto, RateOrderDto } from './dto/order.dto';
import { AuthUser } from '../common/interfaces';
import { generateReference, buildQrPayload } from '../common/utils';
import { GetCartQueryDto } from '../cart/dto/cart.dto';

const ORDER_TTL_MINUTES = 30;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private cartService: CartService,
    private promoService: PromoService,
  ) {}

  async checkout(dto: CheckoutDto): Promise<Order[]> {
    if (!dto.userId && !dto.sessionId) {
      throw new BadRequestException('userId ou sessionId requis');
    }

    const cartQuery: GetCartQueryDto = {
      userId: dto.userId,
      sessionId: dto.sessionId,
    };
    const cart = await this.cartService.getOrCreate(cartQuery);
    if (!cart.items.length) {
      throw new BadRequestException('Le panier est vide');
    }

    const fulfillmentMode = dto.fulfillmentMode ?? 'pickup';
    const taxRate = dto.taxRate ?? 18;
    const storeGroups = this.cartService.groupByStore(cart.items);
    const orders: Order[] = [];
    const cartSubtotal = this.cartService.computeSubtotal(cart.items);
    let totalDiscount = 0;

    if (cart.promoCode) {
      const promo = await this.promoService.validate(cart.promoCode, cartSubtotal, fulfillmentMode);
      totalDiscount = promo.discountAmount;
    }

    for (const [storeId, items] of storeGroups) {
      const subtotal = this.cartService.computeSubtotal(items);
      const discount = cartSubtotal > 0
        ? Math.round((totalDiscount * subtotal) / cartSubtotal * 100) / 100
        : 0;

      const afterDiscount = Math.max(subtotal - discount, 0);
      const tax = Math.round(afterDiscount * taxRate) / 100;
      const total = afterDiscount + tax;
      const reference = await this.uniqueReference();
      const expiresAt = new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000);

      const qrPayload = buildQrPayload({
        reference,
        storeId,
        total,
        items,
      });

      const order = this.orderRepo.create({
        reference,
        userId: dto.userId ?? null,
        storeId,
        items,
        subtotal,
        tax,
        discount,
        total,
        currency: 'XOF',
        status: 'pending',
        fulfillmentMode,
        contactName: dto.contactName ?? null,
        contactPhone: dto.contactPhone ?? null,
        contactEmail: dto.contactEmail ?? null,
        paymentMethod: dto.paymentMethod ?? null,
        qrPayload,
        expiresAt,
      });

      orders.push(await this.orderRepo.save(order));
    }

    if (cart.promoCode) {
      await this.promoService.incrementUsage(cart.promoCode);
    }

    await this.cartService.clear(cartQuery);
    return orders;
  }

  async findAll(query: ListOrdersQueryDto) {
    const where: FindOptionsWhere<Order> = {};
    if (query.storeId) where.storeId = query.storeId;
    if (query.status) where.status = query.status;
    if (query.userId) where.userId = query.userId;

    const data = await this.orderRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }
    return order;
  }

  async redeem(id: string, seller: AuthUser): Promise<Order> {
    const order = await this.findOne(id);

    if (seller.role !== 'vendeur' && seller.role !== 'manager') {
      throw new ForbiddenException('Accès réservé aux vendeurs');
    }
    if (seller.role === 'vendeur' && seller.storeId && seller.storeId !== order.storeId) {
      throw new ForbiddenException('Cette commande appartient à un autre magasin');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException(`Impossible de valider une commande ${order.status}`);
    }
    if (order.expiresAt < new Date()) {
      order.status = 'expired';
      await this.orderRepo.save(order);
      throw new BadRequestException('Commande expirée');
    }

    order.status = 'redeemed';
    order.redeemedAt = new Date();
    order.redeemedBy = seller.id;
    return this.orderRepo.save(order);
  }

  async rate(id: string, userId: string, dto: RateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    if (order.userId && order.userId !== userId) {
      throw new ForbiddenException('Vous ne pouvez noter que vos propres commandes');
    }
    if (order.status !== 'redeemed') {
      throw new BadRequestException('La commande doit être validée avant notation');
    }
    if (order.sellerRating !== null) {
      throw new BadRequestException('Commande déjà notée');
    }

    order.sellerRating = dto.rating;
    order.sellerComment = dto.comment ?? null;
    return this.orderRepo.save(order);
  }

  async cancel(id: string, userId?: string): Promise<Order> {
    const order = await this.findOne(id);

    if (userId && order.userId && order.userId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException(`Impossible d\'annuler une commande ${order.status}`);
    }

    order.status = 'cancelled';
    return this.orderRepo.save(order);
  }

  async expirePendingOrders(): Promise<number> {
    const now = new Date();
    const result = await this.orderRepo.update(
      { status: 'pending', expiresAt: LessThan(now) },
      { status: 'expired' },
    );
    const count = result.affected ?? 0;
    if (count > 0) {
      this.logger.log(`Expired ${count} pending order(s)`);
    }
    return count;
  }

  private async uniqueReference(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt++) {
      const reference = generateReference();
      const existing = await this.orderRepo.findOne({ where: { reference } });
      if (!existing) {
        return reference;
      }
    }
    throw new BadRequestException('Impossible de générer une référence unique');
  }
}
