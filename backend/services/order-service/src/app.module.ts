import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Cart } from './entities/cart.entity';
import { Order } from './entities/order.entity';
import { PromoCode } from './entities/promo-code.entity';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { PromoModule } from './promo/promo.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      schema: 'orders',
      entities: [Cart, Order, PromoCode],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    PromoModule,
    CartModule,
    OrdersModule,
  ],
})
export class AppModule {}
