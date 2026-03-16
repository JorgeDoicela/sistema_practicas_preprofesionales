import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDocumentDatesDto } from './dto/update-document-dates.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async updateDates(id: string, dto: UpdateDocumentDatesDto) {
    const { startDate, dueDate } = dto;

    // RF-DOC-001: Validación de fechas
    if (new Date(startDate) >= new Date(dueDate)) {
      throw new BadRequestException('La fecha de apertura debe ser anterior a la fecha límite');
    }

    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Regla de Negocio: Solo modificar si no ha sido aprobado definitivamente
    if (document.status === 'APROBADO_DEFINITIVO') {
      throw new BadRequestException('No se pueden modificar las fechas de un documento ya aprobado definitivamente');
    }

    return this.prisma.document.update({
      where: { id },
      data: {
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
      }
    });
  }

  async findByInternship(internshipId: string) {
    return this.prisma.document.findMany({
      where: { internshipId },
      orderBy: { createdAt: 'asc' }
    });
  }
}
