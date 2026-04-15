import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(private prisma: PrismaService) {}

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
      where: { internshipId },
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
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { internshipId },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluación no encontrada para este internship');
    }

    return evaluation;
  }
}
