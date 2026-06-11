import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
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
  @Roles(Role.EMPRESA, Role.COORDINADOR, Role.TUTOR)
  async createOrUpdate(@Body() dto: CreateEvaluationDto, @Req() req: any) {
    return this.evaluationsService.createOrUpdate(dto, req.user);
  }

  @Get('internship/:id')
  @Roles(
    Role.EMPRESA,
    Role.COORDINADOR,
    Role.TUTOR,
    Role.ESTUDIANTE,
  )
  async findByInternship(@Param('id') id: string, @Req() req: any) {
    return this.evaluationsService.findByInternship(id, req.user);
  }

  @Get('internship/:id/grade')
  @Roles(Role.ESTUDIANTE, Role.TUTOR, Role.COORDINADOR)
  async getInternshipGrade(@Param('id') id: string) {
    const grade = await this.evaluationsService.calculateInternshipGrade(id);
    return { internshipId: id, grade };
  }
}
