import { IsOptional, IsString, IsUUID, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class IdentityQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() completedOnboarding?: boolean;
  @IsOptional() @IsArray() domains?: string[];
  @IsOptional() @IsArray() subcategories?: string[];
  @IsOptional() @IsNumber() budgetMin?: number;
  @IsOptional() @IsNumber() budgetMax?: number;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsNumber() radiusKm?: number;
  @IsOptional() @IsString() preferredMode?: string;
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() notificationsEnabled?: boolean;
  @IsOptional() @IsNumber() lat?: number;
  @IsOptional() @IsNumber() lng?: number;
}

export class ToggleFavoriteDto {
  @IsUUID()
  productId: string;
}
