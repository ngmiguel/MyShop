import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SellerStatus } from '../../entities/seller.entity';

export class SellerQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'active', 'suspended'] })
  @IsOptional()
  @IsEnum(['pending', 'active', 'suspended'])
  status?: SellerStatus;
}
