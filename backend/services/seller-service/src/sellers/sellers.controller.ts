import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiParam,
} from '@nestjs/swagger';
import { SellersService } from './sellers.service';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { LoginSellerDto } from './dto/login-seller.dto';
import { SellerQueryDto } from './dto/seller-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscription vendeur avec code d\'accès boutique' })
  register(@Body() dto: RegisterSellerDto) {
    return this.sellersService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Connexion vendeur',
    description: 'Authentifie via auth-service. Crée le compte auth si le profil vendeur existe sans userId.',
  })
  login(@Body() dto: LoginSellerDto) {
    return this.sellersService.login(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des vendeurs (manager) — filtres storeId, status' })
  findAll(@Query() query: SellerQueryDto) {
    return this.sellersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'vendeur')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail vendeur' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellersService.findOne(id);
  }

  @Get(':id/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager', 'vendeur')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'KPIs vendeur — ventes, CA, note, délai remise' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getPerformance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.sellersService.getPerformance(id, user);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approuver un vendeur en attente' })
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellersService.approve(id);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspendre un vendeur' })
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellersService.suspend(id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Réactiver un vendeur suspendu' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.sellersService.activate(id);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Créer 3 vendeurs démo' })
  seed() {
    return this.sellersService.seed();
  }
}
