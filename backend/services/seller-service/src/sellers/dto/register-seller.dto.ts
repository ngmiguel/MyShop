import {
  IsEmail, IsOptional, IsString, MinLength, IsUUID, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterSellerDto {
  @ApiProperty({ example: 'Amadou' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Diallo' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'vendeur@myshop.app' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Vendeur2026!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'BOUTIK-2026' })
  @IsString()
  accessCode: string;

  @ApiPropertyOptional({ description: 'Optionnel — validation locale si fourni avec accessCode' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'matin' })
  @IsOptional()
  @IsString()
  shift?: string;
}
