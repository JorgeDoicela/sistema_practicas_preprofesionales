import { Controller, Get, Param, Res, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('global-stats')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  async getGlobalStats() {
    return this.reportsService.getGlobalStats();
  }

  @Get('export/global/excel')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  async exportGlobalExcel(@Res() res: Response) {
    const buffer = await this.reportsService.exportGlobalStatusExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-global.xlsx');
    res.send(buffer);
  }

  @Get('export/global/pdf')
  @Roles(Role.ADMIN, Role.COORDINADOR)
  async exportGlobalPdf(@Res() res: Response) {
    const buffer = await this.reportsService.exportGlobalStatusPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-global.pdf');
    res.send(buffer);
  }

  @Get('export/attendance/:internshipId/excel')
  @Roles(Role.ADMIN, Role.COORDINADOR, Role.TUTOR)
  async exportAttendanceExcel(
    @Param('internshipId') internshipId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportInternshipAttendanceExcel(internshipId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=asistencia-${internshipId}.xlsx`);
    res.send(buffer);
  }
}
