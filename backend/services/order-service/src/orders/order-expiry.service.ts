import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderExpiryService {
  private readonly logger = new Logger(OrderExpiryService.name);

  constructor(private ordersService: OrdersService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiry(): Promise<void> {
    try {
      await this.ordersService.expirePendingOrders();
    } catch (err) {
      this.logger.error('Failed to expire pending orders', err);
    }
  }
}
