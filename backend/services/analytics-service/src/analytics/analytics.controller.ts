import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPIs globaux' })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('monitoring')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Santé des services (manager)' })
  getMonitoring() {
    return this.analyticsService.getMonitoring();
  }

  @Get('dashboard')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tableau de bord manager' })
  getDashboard(@Query('storeId') storeId?: string) {
    return this.analyticsService.getDashboard(storeId);
  }

  @Get('profit')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyse marge / profit' })
  getProfit(@Query('storeId') storeId?: string) {
    return this.analyticsService.getProfit(storeId);
  }
}
