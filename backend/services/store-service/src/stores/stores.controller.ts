import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreQueryDto } from './dto/store-query.dto';
import { RegenerateAccessCodeDto } from './dto/regenerate-access-code.dto';
import { ManagerAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.types';

@ApiTags('stores')
@Controller()
export class StoresController {
  constructor(private storesService: StoresService) {}

  @Get('stores')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'List stores',
    description: 'Public: active stores only (city, category filters). Manager JWT: all stores with status filter.',
  })
  findAll(
    @Query() query: StoreQueryDto,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.storesService.findAll(query, user);
  }

  @Get('stores/validate-code/:code')
  @ApiOperation({ summary: 'Validate seller access code for a store' })
  validateAccessCode(
    @Param('code') code: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.storesService.validateAccessCode(code, storeId);
  }

  @Get('stores/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get store by id',
    description: 'Public: active stores only. Manager JWT: any store.',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser | null,
  ) {
    return this.storesService.findOne(id, user);
  }

  @Post('stores')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a store (manager only)' })
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto);
  }

  @Patch('stores/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a store (manager only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, dto);
  }

  @Delete('stores/:id')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a store (manager only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storesService.remove(id);
  }

  @Post('stores/:id/regenerate-access-code')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate seller access code (manager only)' })
  regenerateAccessCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegenerateAccessCodeDto,
  ) {
    return this.storesService.regenerateAccessCode(id, dto);
  }

  @Post('seed')
  @UseGuards(ManagerAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed 5 demo stores in Abidjan if empty (manager only)' })
  seed() {
    return this.storesService.seed();
  }
}
