import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { StoresModule } from './stores/stores.module';
import { Store } from './entities/store.entity';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      schema: 'store',
      entities: [Store],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
    }),
    StoresModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
