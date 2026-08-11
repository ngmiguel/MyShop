import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Seller } from './entities/seller.entity';
import { Review } from './entities/review.entity';
import { SellersModule } from './sellers/sellers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      schema: 'seller',
      entities: [Seller, Review],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev_secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
    SellersModule,
    ReviewsModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
