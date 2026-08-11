import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegenerateAccessCodeDto {
  @ApiPropertyOptional({ example: 9, minimum: 6, maximum: 16 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(16)
  length?: number;

  @ApiPropertyOptional({ example: 90, description: 'Validity period in days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;
}
