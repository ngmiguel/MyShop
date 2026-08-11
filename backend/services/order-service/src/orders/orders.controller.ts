import {
  Controller, Get, Post, Param, Body, Query, UseGuards, Request, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto, ListOrdersQueryDto, RateOrderDto } from './dto/order.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/interfaces';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Passer commande — scinde le panier par magasin' })
  checkout(@Body() dto: CheckoutDto) {
    return this.ordersService.checkout(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les commandes avec filtres' })
  findAll(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une commande' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/redeem')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendeur', 'manager')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Valider une commande (vendeur)' })
  redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: AuthUser },
  ) {
    return this.ordersService.redeem(id, req.user);
  }

  @Post(':id/rate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Noter le vendeur après validation' })
  rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateOrderDto,
    @Request() req: { user: AuthUser },
  ) {
    return this.ordersService.rate(id, req.user.id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Annuler une commande en attente' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: AuthUser },
  ) {
    return this.ordersService.cancel(id, req.user.id);
  }
}
