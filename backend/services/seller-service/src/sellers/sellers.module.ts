import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seller } from '../entities/seller.entity';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { AuthClient } from '../common/clients/auth.client';
import { StoreClient } from '../common/clients/store.client';

@Module({
  imports: [TypeOrmModule.forFeature([Seller])],
  controllers: [SellersController],
  providers: [SellersService, AuthClient, StoreClient],
  exports: [SellersService],
})
export class SellersModule {}
