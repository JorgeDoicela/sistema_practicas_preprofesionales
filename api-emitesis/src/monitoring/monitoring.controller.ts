import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { CreateVisitDto } from './dto/visit.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';

@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post('visits')
  @Roles(Role.TUTOR, Role.ADMIN, Role.COORDINADOR)
  async create(@Body() dto: CreateVisitDto) {
    return this.monitoringService.create(dto);
  }

  @Get('visits/internship/:id')
  @Roles(Role.TUTOR, Role.ADMIN, Role.COORDINADOR, Role.ESTUDIANTE)
  async findByInternship(@Param('id') id: string) {
    return this.monitoringService.findByInternship(id);
  }

  @Delete('visits/:id')
  @Roles(Role.TUTOR, Role.ADMIN, Role.COORDINADOR)
  async remove(@Param('id') id: string) {
    return this.monitoringService.remove(id);
  }
}
