import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../common/interfaces';
import {
  AddCartItemDto, ApplyPromoDto, GetCartQueryDto, UpdateCartItemDto,
} from './dto/cart.dto';
import { PromoService } from '../promo/promo.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    private promoService: PromoService,
  ) {}

  async getOrCreate(query: GetCartQueryDto): Promise<Cart> {
    this.assertIdentity(query);
    let cart = await this.findCart(query);
    if (!cart) {
      cart = this.cartRepo.create({
        userId: query.userId ?? null,
        sessionId: query.sessionId ?? null,
        items: [],
        promoCode: null,
      });
      cart = await this.cartRepo.save(cart);
    }
    return cart;
  }

  async addItem(query: GetCartQueryDto, dto: AddCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreate(query);
    const items = [...cart.items];
    const idx = items.findIndex((i) => i.productId === dto.productId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: items[idx].quantity + dto.quantity };
    } else {
      items.push({
        productId: dto.productId,
        storeId: dto.storeId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
        imageUrl: dto.imageUrl,
      });
    }
    cart.items = items;
    return this.cartRepo.save(cart);
  }

  async updateItem(query: GetCartQueryDto, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getOrCreate(query);
    const item = cart.items.find((i) => i.productId === dto.productId);
    if (!item) {
      throw new NotFoundException('Article introuvable dans le panier');
    }
    item.quantity = dto.quantity;
    cart.items = [...cart.items];
    return this.cartRepo.save(cart);
  }

  async removeItem(query: GetCartQueryDto, productId: string): Promise<Cart> {
    const cart = await this.getOrCreate(query);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.productId !== productId);
    if (cart.items.length === before) {
      throw new NotFoundException('Article introuvable dans le panier');
    }
    return this.cartRepo.save(cart);
  }

  async clear(query: GetCartQueryDto): Promise<Cart> {
    const cart = await this.getOrCreate(query);
    cart.items = [];
    cart.promoCode = null;
    return this.cartRepo.save(cart);
  }

  async applyPromo(query: GetCartQueryDto, dto: ApplyPromoDto): Promise<Cart & { promoDetails?: object }> {
    const cart = await this.getOrCreate(query);
    if (!cart.items.length) {
      throw new BadRequestException('Le panier est vide');
    }
    const subtotal = this.computeSubtotal(cart.items);
    const promo = await this.promoService.validate(dto.code, subtotal);
    cart.promoCode = promo.code;
    const saved = await this.cartRepo.save(cart);
    return { ...saved, promoDetails: promo };
  }

  computeSubtotal(items: CartItem[]): number {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  groupByStore(items: CartItem[]): Map<string, CartItem[]> {
    const groups = new Map<string, CartItem[]>();
    for (const item of items) {
      const list = groups.get(item.storeId) ?? [];
      list.push(item);
      groups.set(item.storeId, list);
    }
    return groups;
  }

  private assertIdentity(query: GetCartQueryDto): void {
    if (!query.userId && !query.sessionId) {
      throw new BadRequestException('userId ou sessionId requis');
    }
  }

  private findCart(query: GetCartQueryDto): Promise<Cart | null> {
    if (query.userId) {
      return this.cartRepo.findOne({ where: { userId: query.userId } });
    }
    return this.cartRepo.findOne({ where: { sessionId: query.sessionId } });
  }
}
