import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StoreStatus } from '../../entities/store.entity';

export class StoreQueryDto {
  @ApiPropertyOptional({ example: 'Abidjan' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: ['active', 'draft', 'paused', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'draft', 'paused', 'suspended'])
  status?: StoreStatus;

  @ApiPropertyOptional({ example: 'style', description: 'Filter by main category or categories list' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
