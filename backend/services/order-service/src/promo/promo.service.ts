import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from '../entities/promo-code.entity';
import { FulfillmentMode } from '../entities/order.entity';

export interface PromoValidationResult {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
}

interface BuiltInPromo {
  discountType: 'percent' | 'fixed';
  discountValue: number;
  pickupOnly?: boolean;
}

const BUILT_IN_PROMOS: Record<string, BuiltInPromo> = {
  BIENVENUE10: { discountType: 'percent', discountValue: 10 },
  BOUTIKA5: { discountType: 'percent', discountValue: 5 },
  RETRAIT15: { discountType: 'percent', discountValue: 15, pickupOnly: true },
};

@Injectable()
export class PromoService {
  constructor(
    @InjectRepository(PromoCode)
    private promoRepo: Repository<PromoCode>,
  ) {}

  async validate(
    code: string,
    subtotal: number,
    fulfillmentMode: FulfillmentMode = 'pickup',
  ): Promise<PromoValidationResult> {
    const normalized = code.trim().toUpperCase();
    const builtIn = BUILT_IN_PROMOS[normalized];

    if (builtIn) {
      if (builtIn.pickupOnly && fulfillmentMode !== 'pickup') {
        throw new BadRequestException('Le code RETRAIT15 est valable uniquement pour le retrait en magasin');
      }
      return {
        code: normalized,
        discountType: builtIn.discountType,
        discountValue: builtIn.discountValue,
        discountAmount: this.calculateDiscount(subtotal, builtIn.discountType, builtIn.discountValue),
      };
    }

    const promo = await this.promoRepo.findOne({ where: { code: normalized, isActive: true } });
    if (!promo) {
      throw new NotFoundException('Code promo invalide');
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      throw new BadRequestException('Code promo pas encore actif');
    }
    if (promo.validUntil && now > promo.validUntil) {
      throw new BadRequestException('Code promo expiré');
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Code promo épuisé');
    }
    if (Number(subtotal) < Number(promo.minOrder)) {
      throw new BadRequestException(`Montant minimum requis: ${promo.minOrder}`);
    }

    return {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      discountAmount: this.calculateDiscount(subtotal, promo.discountType, Number(promo.discountValue)),
    };
  }

  calculateDiscount(subtotal: number, type: 'percent' | 'fixed', value: number): number {
    if (type === 'percent') {
      return Math.round(subtotal * value) / 100;
    }
    return Math.min(value, subtotal);
  }

  async incrementUsage(code: string): Promise<void> {
    const normalized = code.trim().toUpperCase();
    if (BUILT_IN_PROMOS[normalized]) {
      return;
    }
    await this.promoRepo.increment({ code: normalized }, 'usedCount', 1);
  }
}
