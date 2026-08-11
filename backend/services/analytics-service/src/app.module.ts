import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DailyMetric, OrderSnapshot, SellerSnapshot, StoreSnapshot,
} from './entities/analytics.entity';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [DailyMetric, OrderSnapshot, StoreSnapshot, SellerSnapshot],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    AnalyticsModule,
  ],
})
export class AppModule {}
