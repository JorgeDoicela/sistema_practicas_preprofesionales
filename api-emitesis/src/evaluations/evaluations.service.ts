import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto } from './dto/evaluation.dto';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private notificationsService: NotificationsService,
  ) {}

  async createOrUpdate(dto: CreateEvaluationDto, actor?: { id: string; role: string; companyId?: string | null }) {
    if (!actor || !actor.id) {
      throw new ForbiddenException('No se ha proporcionado un evaluador autenticado válido.');
    }

    const { internshipId, ...data } = dto;

    // Verificar que el internship existe
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: { id: true, studentId: true, tutorId: true, companyId: true },
    });

    if (!internship) {
      throw new NotFoundException('Internship no encontrado');
    }

    if (actor.role === 'EMPRESA') {
      if (data.type !== 'EMPRESARIAL') {
        throw new ForbiddenException('La empresa solo puede registrar evaluaciones empresariales.');
      }
      if (actor.companyId !== internship.companyId) {
        throw new ForbiddenException('No puedes evaluar prácticas de otra empresa.');
      }
    }

    if (actor.role === 'TUTOR' && internship.tutorId !== actor.id) {
      throw new ForbiddenException('Solo el tutor académico asignado puede evaluar esta práctica.');
    }

    const result = await this.prisma.evaluation.upsert({
      where: {
        internshipId_type: {
          internshipId,
          type: data.type as any,
        },
      },
      update: { ...data, evaluatorId: actor?.id, status: 'COMPLETADO' },
      create: { internshipId, ...data, evaluatorId: actor?.id, status: 'COMPLETADO' },
    });

    // Notificar al estudiante que recibió una evaluación
    const typeLabel = data.type === 'ACADEMICA' ? 'académica (Tutor)' : 'empresarial (Empresa)';
    const internshipData = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: { studentId: true },
    });
    if (internshipData) {
      await this.notificationsService.createInApp(
        internshipData.studentId,
        `Nueva evaluación ${typeLabel}`,
        `Has recibido tu evaluación ${typeLabel}. Revísala en tu portal de evaluaciones.`,
        'SUCCESS',
        '/dashboard/mi-evaluacion',
      );
    }

    return result;
  }

  async findByInternship(internshipId: string, actor?: { id: string; role: string; companyId?: string | null }) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      select: { studentId: true, tutorId: true, companyId: true },
    });

    if (!internship) {
      throw new NotFoundException('Internship no encontrado');
    }

    if (actor && actor.role !== 'COORDINADOR' && actor.role !== 'ADMIN') {
      const isOwnerStudent = internship.studentId === actor.id;
      const isOwnerTutor = internship.tutorId === actor.id;
      const isOwnerCompany = internship.companyId === actor.companyId;
      if (!isOwnerStudent && !isOwnerTutor && !isOwnerCompany) {
        throw new ForbiddenException('No tienes permiso para consultar evaluaciones de esta práctica.');
      }
    }

    return this.prisma.evaluation.findMany({
      where: { internshipId },
      include: {
        evaluator: { select: { id: true, fullName: true, email: true, role: true } },
      },
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
