import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Export')
@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('master-report')
  @Roles('ADMIN', 'COORDINADOR')
  @ApiOperation({ summary: 'Genera y descarga el reporte maestro de pasantías en formato Excel' })
  async downloadMasterReport(@Res() res: Response) {
    return this.exportService.generateMasterReport(res);
  }
}
