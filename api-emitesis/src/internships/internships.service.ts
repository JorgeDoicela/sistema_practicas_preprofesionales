import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { EmailService } from '../notifications/email.service';
import { FALLBACK_DOCUMENT_TEMPLATES } from '../document-templates/document-templates.constants';

import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class InternshipsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private systemLogs: SystemLogsService,
  ) {}

  async create(dto: CreateInternshipDto) {
    const { studentId, companyId, tutorId, startDate, totalHours, location, businessTutorName, businessTutorEmail } = dto;

    // A1: Estudiante ya asignado
    const activeInternship = await this.prisma.internship.findFirst({
      where: {
        studentId,
        status: { in: ['En Proceso', 'Activo'] }
      }
    });

    if (activeInternship) {
      throw new ConflictException('El estudiante ya tiene una asignación activa de prácticas');
    }

    // A2: Empresa sin convenio vigente
    const activeAgreement = await this.prisma.agreement.findFirst({
      where: {
        companyId,
        status: 'Activo'
      }
    });

    if (!activeAgreement) {
      throw new BadRequestException('La empresa seleccionada no tiene un convenio vigente activo');
    }

    // Regla de Negocio: Fecha de inicio no anterior a la actual
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start < today) {
      throw new BadRequestException('La fecha de inicio no puede ser anterior a la fecha actual');
    }

    try {
      const internship = await this.prisma.$transaction(async (tx) => {
        const newInternship = await tx.internship.create({
          data: {
            studentId,
            companyId,
            tutorId,
            startDate: start,
            totalHours,
            location,
            businessTutorName,
            businessTutorEmail,
            status: 'En Proceso'
          },
          include: {
            student: true,
            company: true,
            tutor: true
          }
        });

        // RF-DOC-001: documentos según plantillas activas (o lista de respaldo)
        const templates = await tx.documentTemplate.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        });

        type Row = {
          name: string;
          sortOrder: number;
          isRequired: boolean;
          isCertificateSlot: boolean;
          blankFileKey: string | null;
          templateId: string | null;
        };

        let rows: Row[];
        if (templates.length === 0) {
          rows = FALLBACK_DOCUMENT_TEMPLATES.map((t) => ({
            ...t,
            templateId: null,
          }));
        } else {
          const certSlots = templates.filter((t) => t.isCertificateSlot);
          if (certSlots.length !== 1) {
            throw new BadRequestException(
              'El catálogo de plantillas activas debe incluir exactamente un documento de tipo “Certificado / cierre”. Revise coordinación → Plantillas de documentos.',
            );
          }
          rows = templates.map((t) => ({
            name: t.name,
            sortOrder: t.sortOrder,
            isRequired: t.isRequired,
            isCertificateSlot: t.isCertificateSlot,
            blankFileKey: t.blankFileKey ?? null,
            templateId: t.id,
          }));
        }

        await tx.document.createMany({
          data: rows.map((r) => ({
            internshipId: newInternship.id,
            name: r.name,
            status: 'PENDIENTE' as const,
            templateId: r.templateId,
            isRequired: r.isRequired,
            isCertificateSlot: r.isCertificateSlot,
            blankFileKey: r.blankFileKey,
            sortOrder: r.sortOrder,
          })),
        });

        return newInternship;
      });

      // Generar Buffer de Excel para adjuntar (Requisito de negocio)
      const excelBuffer = await this.emailService.generateAssignmentExcelBuffer({
        studentName: internship.student.fullName,
        companyName: internship.company.name,
        location: internship.location,
        hours: internship.totalHours,
        tutorName: internship.tutor.fullName,
        startDate: startDate,
        businessTutorName: internship.businessTutorName || undefined,
      });

      // RF-ASG-001: Enviar correo al estudiante
      this.emailService.sendAssignmentEmail(
        internship.student.email,
        internship.student.fullName,
        internship.company.name,
        startDate,
        totalHours,
        location,
        businessTutorName,
        excelBuffer
      ).catch((err: Error) => {
        console.error('Error al enviar correo de asignación al estudiante:', err.message);
      });

      // RF-ASG-002: Enviar correo al tutor académico
      this.emailService.sendTutorAssignmentEmail(
        internship.tutor.email,
        internship.tutor.fullName,
        internship.student.fullName,
        internship.company.name,
        startDate,
        totalHours,
        businessTutorName,
        excelBuffer
      ).catch((err: Error) => {
        console.error('Error al enviar correo de asignación al tutor:', err.message);
      });

      return internship;
    } catch (error: unknown) {
      throw new BadRequestException('Error al crear la asignación: ' + (error as Error).message);
    }
  }

  async findAll() {
    return this.prisma.internship.findMany({
      include: {
        student: true,
        company: true,
        tutor: true,
        documents: true,
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 6,
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByTutor(tutorId: string) {
    return this.prisma.internship.findMany({
      where: { tutorId },
      include: {
        student: true,
        company: true,
        documents: true,
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 3,
        },
        evaluations: true,
        monitoringVisits: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.internship.findMany({
      where: { studentId },
      include: {
        student: true,
        company: true,
        tutor: true,
        documents: true,
        attendances: {
          orderBy: { checkIn: 'desc' },
          take: 8,
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.internship.findMany({
      where: { companyId },
      include: {
        student: true,
        company: true,
        tutor: true,
        evaluations: true,
        attendances: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** RF-ATT-LOC: Guardar la lista de ubicaciones permitidas para asistencia */
  async updateLocations(id: string, locations: { label: string; lat: number; lng: number; radiusM?: number }[]) {
    const internship = await this.prisma.internship.findUnique({ where: { id } });
    if (!internship) throw new NotFoundException('Asignación no encontrada');

    // También actualizar lat/lng principal con la primera ubicación para retrocompatibilidad
    const primary = locations[0];
    return this.prisma.internship.update({
      where: { id },
      data: {
        allowedLocations: locations as any,
        lat: primary?.lat ?? internship.lat,
        lng: primary?.lng ?? internship.lng,
      },
    });
  }

  async toggleTest(id: string) {
    const internship = await this.prisma.internship.findUnique({ where: { id } });
    if (!internship) {
      throw new NotFoundException('Asignación no encontrada');
    }
    return this.prisma.internship.update({
      where: { id },
      data: { testEnabled: !internship.testEnabled },
    });
  }

  async findOne(id: string, actor?: { id: string, role: string, email: string }) {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        student: true,
        company: true,
        tutor: true,
        attendances: true,
        documents: true,
        evaluations: true,
        monitoringVisits: {
          orderBy: { date: 'desc' },
        },
      }
    });

    if (!internship) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // PIA: Auditoría de acceso a datos personales (LOPDP)
    // Solo logueamos si el que accede no es el propio estudiante
    if (actor && actor.id !== internship.studentId && (actor.role === 'ADMIN' || actor.role === 'COORDINADOR' || actor.role === 'TUTOR')) {
        this.systemLogs.append({
            level: 'INFO',
            category: 'PRIVACY',
            message: `Acceso a datos personales (PIA): ${actor.role} consultó el expediente del estudiante ${internship.student.fullName}`,
            userId: actor.id,
            actorEmail: actor.email,
            path: `/dashboard/documentos/${id}`,
            metadata: {
                studentId: internship.studentId,
                internshipId: id,
                impact: 'PERSONAL_DATA_EXPOSURE'
            }
        });
    }

    return internship;
  }
}
