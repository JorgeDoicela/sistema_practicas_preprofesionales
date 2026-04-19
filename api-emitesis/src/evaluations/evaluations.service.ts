import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/evaluation.dto';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async createOrUpdate(dto: CreateEvaluationDto) {
    const { internshipId, ...data } = dto;

    // Verificar que el internship existe
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException('Internship no encontrado');
    }

    return this.prisma.evaluation.upsert({
      where: {
        internshipId_type: {
          internshipId,
          type: data.type as any,
        },
      },
      update: {
        ...data,
        status: 'COMPLETADO',
      },
      create: {
        internshipId,
        ...data,
        status: 'COMPLETADO',
      },
    });
  }

  async findByInternship(internshipId: string) {
    return this.prisma.evaluation.findMany({
      where: { internshipId },
    });
  }

  /**
   * Calcula la calificación final ponderada de una pasantía
   */
  async calculateInternshipGrade(internshipId: string) {
    const evals = await this.prisma.evaluation.findMany({
      where: { internshipId, status: 'COMPLETADO' }
    });

    if (evals.length === 0) return 0;

    const weightBusiness = await this.settings.getNumberValue('EVAL_WEIGHT_BUSINESS', 0.5);
    const weightAcademic = await this.settings.getNumberValue('EVAL_WEIGHT_ACADEMIC', 0.5);

    let totalScore = 0;
    
    evals.forEach(ev => {
      // Promedio simple de los 5 criterios (escala 0-10 o 0-100)
      const avg = (ev.punctuality + ev.teamwork + ev.technicalSkills + ev.proactivity + ev.attitude) / 5;
      
      if (ev.type === 'EMPRESARIAL') {
        totalScore += avg * weightBusiness;
      } else if (ev.type === 'ACADEMICA') {
        totalScore += avg * weightAcademic;
      }
    });

    return parseFloat(totalScore.toFixed(2));
  }
}
