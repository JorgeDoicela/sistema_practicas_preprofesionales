import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAbsenceDto, ReviewAbsenceDto } from './dto/absence.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AbsencesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(studentId: string, dto: CreateAbsenceDto, filePath?: string) {
    const internship = await this.prisma.internship.findFirst({
      where: { studentId, status: { in: ['En Proceso', 'Activo'] } },
      include: { tutor: true },
    });
    if (!internship) throw new BadRequestException('No tienes una práctica activa');

    const absenceDate = new Date(dto.date);
    const existing = await this.prisma.absence.findFirst({
      where: { internshipId: internship.id, date: absenceDate },
    });
    if (existing) throw new BadRequestException('Ya registraste una ausencia para esa fecha');

    const absence = await this.prisma.absence.create({
      data: {
        internshipId: internship.id,
        date: absenceDate,
        reason: dto.reason,
        type: dto.type ?? 'ENFERMEDAD',
        filePath,
        status: 'PENDIENTE',
      },
    });

    // Notificar al tutor académico
    await this.notifications.createInApp(
      internship.tutorId,
      'Nueva Ausencia Justificada',
      `El estudiante tiene una ausencia pendiente de revisión para el ${absenceDate.toLocaleDateString('es-EC')}.`,
      'WARNING',
      '/tutor-academico/ausencias',
    );

    return absence;
  }

  async findByInternship(internshipId: string) {
    return this.prisma.absence.findMany({
      where: { internshipId },
      include: { reviewedBy: { select: { fullName: true, role: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findPendingForTutor(tutorId: string) {
    return this.prisma.absence.findMany({
      where: {
        internship: { tutorId },
        status: 'PENDIENTE',
      },
      include: {
        internship: { include: { student: { select: { fullName: true, cedula: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForCoordinator() {
    return this.prisma.absence.findMany({
      include: {
        internship: {
          include: {
            student: { select: { fullName: true, cedula: true } },
            tutor: { select: { fullName: true } },
          },
        },
        reviewedBy: { select: { fullName: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async review(absenceId: string, reviewerId: string, dto: ReviewAbsenceDto, reviewerRole: string) {
    const absence = await this.prisma.absence.findUnique({
      where: { id: absenceId },
      include: { internship: { include: { student: true } } },
    });
    if (!absence) throw new NotFoundException('Ausencia no encontrada');
    if (absence.status !== 'PENDIENTE') {
      throw new BadRequestException('Esta ausencia ya fue revisada');
    }

    // Validación de permisos
    if (reviewerRole === 'TUTOR' && absence.internship.tutorId !== reviewerId) {
      throw new ForbiddenException('No tienes permiso para revisar esta ausencia');
    }

    const updated = await this.prisma.absence.update({
      where: { id: absenceId },
      data: {
        status: dto.status,
        reviewNotes: dto.reviewNotes,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
    });

    const statusLabel = dto.status === 'APROBADA' ? 'aprobada' : 'rechazada';
    await this.notifications.createInApp(
      absence.internship.studentId,
      `Ausencia ${statusLabel}`,
      `Tu ausencia del ${absence.date.toLocaleDateString('es-EC')} fue ${statusLabel}.${dto.reviewNotes ? ' Nota: ' + dto.reviewNotes : ''}`,
      dto.status === 'APROBADA' ? 'SUCCESS' : 'WARNING',
      '/dashboard/ausencias',
    );

    return updated;
  }
}
