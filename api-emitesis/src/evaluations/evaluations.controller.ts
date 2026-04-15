import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/evaluation.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(Role.EMPRESA, Role.ADMIN, Role.COORDINADOR)
  async createOrUpdate(@Body() dto: CreateEvaluationDto) {
    return this.evaluationsService.createOrUpdate(dto);
  }

  @Get('internship/:id')
  async findByInternship(@Param('id') id: string) {
    return this.evaluationsService.findByInternship(id);
  }
}
