import {
  Controller, Get, Post, Patch, Delete, Body, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import {
  AddCartItemDto,
  ApplyPromoDto,
  ClearCartQueryDto,
  GetCartQueryDto,
  RemoveCartItemDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Obtenir ou créer un panier par sessionId ou userId' })
  getCart(@Query() query: GetCartQueryDto) {
    return this.cartService.getOrCreate(query);
  }

  @Post('items')
  @ApiOperation({ summary: 'Ajouter un article au panier' })
  addItem(@Query() query: GetCartQueryDto, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(query, dto);
  }

  @Patch('items')
  @ApiOperation({ summary: 'Mettre à jour la quantité d\'un article' })
  updateItem(@Query() query: GetCartQueryDto, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(query, dto);
  }

  @Delete('items')
  @ApiOperation({ summary: 'Retirer un article du panier' })
  removeItem(@Query() query: GetCartQueryDto, @Body() dto: RemoveCartItemDto) {
    return this.cartService.removeItem(query, dto.productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vider le panier' })
  clear(@Query() query: ClearCartQueryDto) {
    return this.cartService.clear(query);
  }

  @Post('promo')
  @ApiOperation({ summary: 'Appliquer un code promo au panier' })
  applyPromo(@Query() query: GetCartQueryDto, @Body() dto: ApplyPromoDto) {
    return this.cartService.applyPromo(query, dto);
  }
}
