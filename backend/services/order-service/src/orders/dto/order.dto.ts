import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, IsEmail,
} from 'class-validator';
import { FulfillmentMode, OrderStatus } from '../entities/order.entity';

export class CheckoutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ enum: ['pickup', 'delivery'], default: 'pickup' })
  @IsOptional()
  @IsEnum(['pickup', 'delivery'])
  fulfillmentMode?: FulfillmentMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Tax rate percent', default: 18 })
  @IsOptional()
  taxRate?: number;
}

export class ListOrdersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'redeemed', 'expired', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'redeemed', 'expired', 'cancelled'])
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class RateOrderDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
