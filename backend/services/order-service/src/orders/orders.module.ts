import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { CartModule } from '../cart/cart.module';
import { PromoModule } from '../promo/promo.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderExpiryService } from './order-expiry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CartModule,
    PromoModule,
    AuthModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderExpiryService],
  exports: [OrdersService],
})
export class OrdersModule {}
