import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginSellerDto {
  @ApiProperty({ example: 'vendeur@myshop.app' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Vendeur2026!' })
  @IsString()
  @MinLength(4)
  password: string;
}
