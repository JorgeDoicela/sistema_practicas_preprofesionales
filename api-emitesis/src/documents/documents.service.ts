import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDocumentDatesDto } from './dto/update-document-dates.dto';
import { ReviewDocumentDto } from './dto/review-document.dto';
import { StorageService } from '../infrastructure/storage/storage.service';
import { EmailService } from '../notifications/email.service';
import { MulterFile } from '../shared/interfaces/multer-file.interface';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private emailService: EmailService,
  ) {}

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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getTemplatePath(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (document.isCertificateSlot) {
      throw new BadRequestException(
        'El certificado de culminación no tiene formato descargable: lo genera el sistema al finalizar la práctica.',
      );
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

    const fileName =
      document.blankFileKey?.trim() || templateMapping[document.name];
    if (!fileName) {
      throw new NotFoundException(
        'No existe un formato descargable para este documento (configure “Archivo .docx” en plantillas o use un nombre con plantilla predefinida).',
      );
    }

    // Si estamos en Vercel Blob (Producción), intentamos buscar la URL del archivo
    const listResult = await this.storageService.listFiles();
    const blob = listResult.blobs?.find(b => b.pathname.includes(fileName));

    return { 
      fileName, 
      url: blob?.url 
    };
  }

  async uploadDocument(id: string, file: MulterFile, studentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            student: true,
            tutor: true,
          }
        }
      }
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Precondición: El estudiante es el dueño del documento
    if (document.internship.studentId !== studentId) {
      throw new BadRequestException('No tienes permisos para subir este documento');
    }

    if (document.isCertificateSlot) {
      throw new BadRequestException(
        'Este documento lo genera el sistema al culminar la práctica; no debe subirse manualmente.',
      );
    }

    // Precondición: No aprobado definitivamente
    if (document.status === 'APROBADO_DEFINITIVO') {
      throw new BadRequestException('Este documento ya ha sido aprobado definitivamente y no puede ser modificado');
    }

    // Regla de Negocio: Dentro del periodo de entrega (A2)
    const now = new Date();
    if (!document.startDate || !document.dueDate) {
        throw new BadRequestException('El tutor aún no ha configurado el periodo de entrega para este documento');
    }

    if (now < document.startDate) {
      throw new BadRequestException(`El periodo de entrega inicia el ${document.startDate.toLocaleDateString()}`);
    }

    if (now > document.dueDate) {
      // Excepción A2: Plazo vencido -> Marcar como INCUMPLIDO (RF-09)
      await this.prisma.document.update({
        where: { id },
        data: { status: 'INCUMPLIDO' as any }
      });
      // RF-09: Notificar al tutor inmediatamente
      if (document.internship.tutor?.email) {
        this.emailService.sendIncumplimientoAlertToTutor(
          document.internship.tutor.email,
          document.internship.tutor.fullName,
          document.internship.student.fullName,
          document.name,
        ).catch(() => {});
      }
      throw new BadRequestException('El plazo de entrega ha vencido. El documento ha sido marcado como Incumplido.');
    }

    // Subir archivo
    const fileName = `documents/${document.internshipId}/${Date.now()}-${file.originalname}`;
    const uploadResult = await this.storageService.upload(fileName, file.buffer, {
        contentType: file.mimetype,
    });

    // Actualizar documento
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        filePath: uploadResult.url,
        submittedAt: now,
        status: 'EN_REVISION_TUTOR',
      }
    });

    // Notificar al tutor (Punto 5 Happy Path)
    if (document.internship.tutor?.email) {
      await this.emailService.sendDocumentNotificationToTutor(
        document.internship.tutor.email,
        document.internship.student.fullName,
        document.name,
      );
    }

    return updatedDocument;
  }

  async reviewDocument(id: string, reviewDto: ReviewDocumentDto, tutorId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            tutor: true,
            student: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Regla de Negocio: Solo el tutor asignado puede revisar
    if (document.internship.tutorId !== tutorId) {
      throw new BadRequestException('No tienes permisos para revisar este documento');
    }

    // Regla de Negocio: No se puede aprobar un documento bloqueado (aprobado definitivamente)
    if (document.status === 'APROBADO_DEFINITIVO') {
      throw new BadRequestException('Este documento ya ha sido aprobado por el coordinador y no puede ser modificado');
    }

    const updatedDoc = await this.prisma.document.update({
      where: { id },
      data: {
        status: reviewDto.status,
        observations: reviewDto.observations ?? null,
        reviewedAt: new Date(),
      },
    });

    // Notificar al estudiante
    if (document.internship.student?.email) {
      await this.emailService.sendDocumentReviewResultToStudent(
        document.internship.student.email,
        document.internship.student.fullName,
        document.name,
        reviewDto.status,
        reviewDto.observations ?? '',
      );
    }

    return updatedDoc;
  }

  async reviewByCoordinator(id: string, reviewDto: ReviewDocumentDto, coordinatorId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            tutor: true,
            student: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Regla de Negocio: Solo documentos aprobados por el tutor (Excepción A1)
    if (document.status !== 'APROBADO_TUTOR') {
      throw new BadRequestException('El coordinador solo puede revisar documentos previamente aprobados por el tutor');
    }

    // Regla de Negocio: Observaciones obligatorias si hay rechazo (Excepción A2)
    if (reviewDto.status === 'RECHAZADO_COORDINADOR' && !reviewDto.observations?.trim()) {
      throw new BadRequestException('Las observaciones del coordinador son obligatorias para rechazar el documento');
    }

    const updatedDoc = await this.prisma.document.update({
      where: { id },
      data: {
        status: reviewDto.status,
        observations: reviewDto.observations ?? null,
        reviewedAt: new Date(),
      },
    });

    // Notificar a Estudiante y Tutor
    if (document.internship.student?.email && document.internship.tutor?.email) {
      await this.emailService.sendCoordinatorReviewResult(
        document.internship.student.email,
        document.internship.tutor.email,
        document.internship.student.fullName,
        document.name,
        reviewDto.status,
        reviewDto.observations ?? '',
      );
    }

    return updatedDoc;
  }
}
