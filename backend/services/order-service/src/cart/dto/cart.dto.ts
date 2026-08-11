import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsUUID, IsNumber, IsOptional, Min, IsNotEmpty,
} from 'class-validator';

export class GetCartQueryDto {
  @ApiPropertyOptional({ description: 'Session ID for anonymous cart' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'User ID for authenticated cart' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsUUID()
  storeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class RemoveCartItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;
}

export class ApplyPromoDto {
  @ApiProperty({ example: 'BIENVENUE10' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ClearCartQueryDto extends GetCartQueryDto {}
