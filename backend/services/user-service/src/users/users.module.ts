import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreferences } from '../entities/preferences.entity';
import { Favorite } from '../entities/favorite.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreferences, Favorite])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
