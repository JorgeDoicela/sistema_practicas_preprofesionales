import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/visit.dto';

@Injectable()
export class MonitoringService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVisitDto, actor?: { id: string; role: string }) {
    const { internshipId, date, ...data } = dto;

    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException('Práctica no encontrada');
    }

    // Un tutor solo puede registrar visitas para su propio pasante
    if (actor && actor.role === 'TUTOR' && internship.tutorId !== actor.id) {
      throw new ForbiddenException('Solo el tutor académico asignado puede registrar visitas de seguimiento.');
    }

    return this.prisma.monitoringVisit.create({
      data: {
        internshipId,
        date: new Date(date),
        ...data,
      },
    });
  }

  async findByInternship(internshipId: string, actor?: { id: string; role: string; companyId?: string | null }) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException('Práctica no encontrada');
    }

    // Validar propiedad para roles no administrativos
    if (actor && actor.role !== 'ADMIN' && actor.role !== 'COORDINADOR') {
      const isOwnerStudent = internship.studentId === actor.id;
      const isOwnerTutor = internship.tutorId === actor.id;
      const isOwnerCompany = internship.companyId === actor.companyId;

      if (!isOwnerStudent && !isOwnerTutor && !isOwnerCompany) {
        throw new ForbiddenException('No tienes permiso para consultar las visitas de esta práctica.');
      }
    }

    return this.prisma.monitoringVisit.findMany({
      where: { internshipId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string, actor?: { id: string; role: string }) {
    const visit = await this.prisma.monitoringVisit.findUnique({
      where: { id },
      include: {
        internship: true,
      },
    });

    if (!visit) {
      throw new NotFoundException('Visita no encontrada');
    }

    // Un tutor solo puede eliminar visitas de sus propias prácticas asignadas
    if (actor && actor.role === 'TUTOR' && visit.internship.tutorId !== actor.id) {
      throw new ForbiddenException('Solo el tutor académico asignado puede eliminar esta visita.');
    }

    return this.prisma.monitoringVisit.delete({
      where: { id },
    });
  }
}
