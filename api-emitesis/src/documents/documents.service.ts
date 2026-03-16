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

  async getTemplatePath(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Regla de Negocio: Solo descargar si está dentro del periodo
    const now = new Date();
    if (!document.startDate) {
        throw new BadRequestException('El tutor aún no ha configurado las fechas para este documento');
    }
    
    if (now < document.startDate) {
      throw new BadRequestException(`El formato estará disponible a partir del ${document.startDate.toLocaleDateString()}`);
    }

    // Regla de Negocio: Si está aprobado definitivo, no se descarga formato para editar (aunque la regla dice "solo visualización")
    if (document.status === 'APROBADO_DEFINITIVO') {
      throw new BadRequestException('Este documento ya ha sido aprobado definitivamente');
    }

    const templateMapping: Record<string, string> = {
      'Solicitud de prácticas': 'solicitud_practicas.docx',
      'Plan de rotación': 'plan_rotacion.docx',
      'Informe de actividades': 'informe_actividades.docx',
      'Registro de asistencia': 'registro_asistencia.docx',
      'Evaluación del tutor académico': 'evaluacion_tutor.docx',
      'Evaluación del representante de la empresa': 'evaluacion_representante.docx',
      'Informe final de prácticas': 'informe_final.docx',
      'Certificado de culminación': 'certificado_culminacion.docx',
    };

    const fileName = templateMapping[document.name];
    if (!fileName) {
      throw new NotFoundException('No existe un formato oficial para este documento');
    }

    return fileName;
  }
}
