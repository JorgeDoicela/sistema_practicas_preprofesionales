import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FALLBACK_DOCUMENT_TEMPLATES } from '../document-templates/document-templates.constants';
import { EvaluationsService } from '../evaluations/evaluations.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { BridgeService } from '../core/bridge.service';

@Injectable()
export class InternshipsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private systemLogs: SystemLogsService,
    private notificationsService: NotificationsService,
    private evaluationsService: EvaluationsService,
    private bridge: BridgeService,
  ) {}

  async create(dto: CreateInternshipDto) {
    const { studentId, companyId, tutorId, startDate, totalHours, location, businessTutorName, businessTutorEmail, initialLat, initialLng, initialRadius } = dto;

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
        const student = await tx.user.findUnique({ 
          where: { id: studentId },
          include: { career: true }
        });
        if (!student) throw new BadRequestException('Estudiante no encontrado');

        // RF-CAREER: Carga automática de horas sugeridas por carrera si no se envían
        let finalHours = totalHours;
        if ((!finalHours || finalHours === 0) && student.career?.config) {
          const config = student.career.config as any;
          if (config.requiredHours) {
            finalHours = config.requiredHours;
          }
        }

        const newInternship = await tx.internship.create({
          data: {
            studentId,
            companyId,
            tutorId,
            careerId: student.careerId,
            startDate: start,
            totalHours: finalHours,
            location,
            businessTutorName,
            businessTutorEmail,
            status: 'En Proceso',
            lat: initialLat,
            lng: initialLng,
            allowedLocations: dto.allowedLocations || (initialLat && initialLng ? [
              { label: 'Sede Principal', lat: initialLat, lng: initialLng, radiusM: initialRadius || 200 }
            ] : undefined)
          },
          include: {
            student: true,
            company: true,
            tutor: true
          }
        });

        // RF-DOC-SPEC: documentos filtrados por carrera del estudiante + globales
        const templates = await tx.documentTemplate.findMany({
          where: { 
            isActive: true,
            OR: [
              { careerId: student.careerId },
              { careerId: null }
            ]
          },
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
        // ... (resto de la lógica igual)
        if (templates.length === 0) {
          rows = FALLBACK_DOCUMENT_TEMPLATES.map((t) => ({
            ...t,
            templateId: null,
          }));
        } else {
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

      // RF-ASG-003: Notificación In-App al estudiante
      await this.notificationsService.createInApp(
        internship.studentId,
        'Nueva asignación de prácticas',
        `Has sido asignado a "${internship.company.name}". Revisa tu correo para más detalles.`,
        'SUCCESS',
        '/dashboard'
      );

      return internship;
    } catch (error: unknown) {
      throw new BadRequestException('Error al crear la asignación: ' + (error as Error).message);
    }
  }

  async findAll(page = 1, limit = 10, filter?: { careerId?: string; role?: string }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    // Si es coordinador, obligatoriamente filtramos por su carrera (aislamiento)
    if (filter?.role === 'COORDINADOR' && filter?.careerId) {
      where.careerId = filter.careerId;
    } else if (filter?.careerId) {
      // Si el admin envía un filtro específico
      where.careerId = filter.careerId;
    }

    const [items, total] = await Promise.all([
      this.prisma.internship.findMany({
        skip,
        take: limit,
        where,
        include: {
          student: true,
          company: true,
          tutor: true,
          career: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.internship.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
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
        statusHistory: {
          include: { changedBy: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
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

    const finalGrade = await this.evaluationsService.calculateInternshipGrade(id);

    return {
       ...internship,
       finalGrade
    };
  }

  /**
   * PIA-CORE: Cálculo del Health Score de la práctica.
   * Proporciona un índice del 0 al 100 sobre la salud y progreso de la práctica.
   */
  async calculateHealthScore(id: string): Promise<{ score: number; indicators: any }> {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        documents: true,
        attendances: true,
        evaluations: true,
      },
    });

    if (!internship) throw new NotFoundException('Asignación no encontrada');

    // 1. Indicador de Documentos (40%)
    const approvedDocs = internship.documents.filter((d) => d.status === 'APROBADO_DEFINITIVO').length;
    const totalDocs = internship.documents.length || 1;
    const docScore = (approvedDocs / totalDocs) * 40;

    // 2. Indicador de Asistencia (30%)
    const attendances = internship.attendances || [];
    let totalMinutes = 0;
    attendances.forEach(att => {
      if (att.checkIn && att.checkOut) {
        totalMinutes += (att.checkOut.getTime() - att.checkIn.getTime()) / (1000 * 60);
      }
    });
    const realHours = totalMinutes / 60;
    const attendanceScore = Math.min((realHours / internship.totalHours) * 30, 30);

    // 3. Indicador de Evaluaciones (30%)
    let evalScore = 20; // Base neutra si no hay evaluaciones
    if (internship.evaluations.length > 0) {
      const avg = internship.evaluations.reduce((acc, e) => {
        const sum = e.punctuality + e.teamwork + e.technicalSkills + e.proactivity + e.attitude;
        return acc + (sum / 25); // max 5 puntos por item, total 25
      }, 0) / internship.evaluations.length;
      evalScore = avg * 30;
    }

    // 4. Penalizaciones por Incumplimiento
    const incumplimientos = internship.documents.filter((d) => d.status === 'INCUMPLIDO').length;
    const penalty = incumplimientos * 5; // -5 puntos por cada documento incumplido

    const totalScore = Math.max(0, Math.min(100, docScore + attendanceScore + evalScore - penalty));

    return {
      score: Math.round(totalScore),
      indicators: {
        documentation: Math.round((docScore / 40) * 100),
        attendance: Math.round((attendanceScore / 30) * 100),
        evaluations: Math.round((evalScore / 30) * 100),
        penalties: penalty,
      },
    };
  }

  /**
   * RF-AUDIT: Cambiar el estado de una pasantía con registro histórico.
   */
  async syncSigafi(id: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      select: { studentId: true }
    });
    if (!internship) throw new NotFoundException('Pasantía no encontrada');
    
    return this.bridge.syncStudentData(internship.studentId);
  }

  async changeStatus(id: string, newStatus: string, actorId: string, reason?: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id }
    });

    if (!internship) throw new NotFoundException('Asignación no encontrada');

    return this.prisma.$transaction(async (tx) => {
      // 1. Registrar en el historial
      await tx.internshipStatusHistory.create({
        data: {
          internshipId: id,
          oldStatus: internship.status,
          newStatus: newStatus,
          changedById: actorId,
          reason: reason || 'Cambio manual por autoridad',
        }
      });

      // 2. Actualizar la pasantía
      return tx.internship.update({
        where: { id },
        data: { status: newStatus },
      });
    });
  }
}
