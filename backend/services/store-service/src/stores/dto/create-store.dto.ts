import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OpeningHours, StoreStatus } from '../../entities/store.entity';

export class OpeningHoursDto implements OpeningHours {
  @ApiProperty({ example: 'Lundi' })
  @IsString()
  day: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  open: string;

  @ApiProperty({ example: '18:30' })
  @IsString()
  close: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  closed: boolean;
}

export class CreateStoreDto {
  @ApiProperty({ example: 'Sankofa Mode' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Sankofa Mode SARL' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @ApiPropertyOptional({ example: 'Le wax revisité, tous les jours.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tagline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  coverIndex?: number;

  @ApiPropertyOptional({ type: [String], example: ['style', 'art'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ example: 'style' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mainCategory?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategories?: string[];

  @ApiPropertyOptional({ example: '14 Rue des Artisans, Plateau' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Abidjan' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiPropertyOptional({ example: 'Lagunes' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ example: 'CI' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiPropertyOptional({ example: 5.3242 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: -4.0198 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ type: [OpeningHoursDto] })
  @IsOptional()
  @IsArray()
  hours?: OpeningHoursDto[];

  @ApiPropertyOptional({ example: '+225 07 88 12 44 90' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@example.ci' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: [String], example: ['mobile_money', 'cash'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  paymentMethods?: string[];

  @ApiPropertyOptional({ example: 'XOF' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  delivery?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  pickup?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: 2018 })
  @IsOptional()
  @IsInt()
  foundedYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  legalStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'SANKOFA-2481' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessCode?: string;

  @ApiPropertyOptional({ example: 90, description: 'Access code validity in days' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  accessCodeDays?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSellers?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoApproveSellers?: boolean;

  @ApiPropertyOptional({ enum: ['active', 'draft', 'paused', 'suspended'] })
  @IsOptional()
  @IsEnum(['active', 'draft', 'paused', 'suspended'])
  status?: StoreStatus;
}
