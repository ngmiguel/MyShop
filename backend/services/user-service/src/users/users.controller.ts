import { Body, Controller, Delete, Get, Headers, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { IdentityQueryDto, ToggleFavoriteDto, UpdatePreferencesDto } from './dto/user.dto';

@ApiTags('users')
@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  private resolveQuery(
    query: IdentityQueryDto,
    sessionHeader?: string,
  ): IdentityQueryDto {
    return {
      userId: query.userId,
      sessionId: query.sessionId ?? sessionHeader,
    };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Obtenir les préférences client' })
  getPreferences(
    @Query() query: IdentityQueryDto,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    return this.usersService.getPreferences(this.resolveQuery(query, sessionHeader));
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Mettre à jour les préférences client' })
  updatePreferences(
    @Query() query: IdentityQueryDto,
    @Body() dto: UpdatePreferencesDto,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    return this.usersService.updatePreferences(this.resolveQuery(query, sessionHeader), dto);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Liste des favoris' })
  getFavorites(
    @Query() query: IdentityQueryDto,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    return this.usersService.getFavorites(this.resolveQuery(query, sessionHeader));
  }

  @Post('favorites/toggle')
  @ApiOperation({ summary: 'Ajouter/retirer un favori' })
  toggleFavorite(
    @Query() query: IdentityQueryDto,
    @Body() dto: ToggleFavoriteDto,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    return this.usersService.toggleFavorite(this.resolveQuery(query, sessionHeader), dto.productId);
  }

  @Delete('favorites')
  @ApiOperation({ summary: 'Alias toggle via DELETE' })
  removeFavorite(
    @Query() query: IdentityQueryDto & { productId: string },
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    return this.usersService.toggleFavorite(this.resolveQuery(query, sessionHeader), query.productId);
  }
}
