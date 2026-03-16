import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class InternshipsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateInternshipDto) {
    const { studentId, companyId, tutorId, startDate, totalHours, location } = dto;

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
            status: 'En Proceso'
          },
          include: {
            student: true,
            company: true,
            tutor: true
          }
        });

        // RF-DOC-001: Inicializar los 8 documentos obligatorios
        const mandatoryDocuments = [
          'Solicitud de prácticas',
          'Plan de rotación',
          'Informe de actividades',
          'Registro de asistencia',
          'Evaluación del tutor académico',
          'Evaluación del representante de la empresa',
          'Informe final de prácticas',
          'Certificado de culminación'
        ];

        await tx.document.createMany({
          data: mandatoryDocuments.map(name => ({
            internshipId: newInternship.id,
            name,
            status: 'PENDIENTE'
          }))
        });

        return newInternship;
      });

      // 7. Enviar correo al estudiante
      this.emailService.sendAssignmentEmail(
        internship.student.email,
        internship.student.fullName,
        internship.company.name,
        startDate,
        totalHours,
        location
      ).catch(err => {
        console.error('Error al enviar correo de asignación:', err.message);
      });

      return internship;
    } catch (error) {
      throw new BadRequestException('Error al crear la asignación: ' + error.message);
    }
  }

  async findAll() {
    return this.prisma.internship.findMany({
      include: {
        student: true,
        company: true,
        tutor: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findByTutor(tutorId: string) {
    return this.prisma.internship.findMany({
      where: { tutorId },
      include: {
        student: true,
        company: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id },
      include: {
        student: true,
        company: true,
        tutor: true,
        attendances: true,
        documents: true
      }
    });

    if (!internship) {
      throw new NotFoundException('Asignación no encontrada');
    }

    return internship;
  }
}
