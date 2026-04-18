import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas globales del sistema' })
  getStats() {
    return this.analyticsService.getAdminStats();
  }

  @Get('health-series')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener serie de tiempo de salud del sistema' })
  getHealthSeries() {
    return this.analyticsService.getSystemHealthSeries();
  }
}
