import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrivacyConsentDto, ArcoRequestDto } from './dto/privacy-actions.dto';
import { Prisma } from '@prisma/client';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class PrivacyService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
  ) {}

  async recordConsent(userId: string, dto: PrivacyConsentDto, ip?: string, userAgent?: string) {
    if (!dto.accepted) {
      throw new BadRequestException('Debe aceptar la política de privacidad para continuar.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    try {
      // 1. Actualizar el estado del usuario
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lopdpAccepted: true,
          lopdpAcceptedAt: new Date(),
          lopdpVersion: dto.version,
        },
      });

      // 2. Crear un log detallado para auditoría (RF-LOPDP)
      return await this.prisma.lopdpLog.create({
        data: {
          userId,
          fullName: user.fullName,
          email: user.email,
          ip: ip || 'Desconocida',
          userAgent: userAgent || 'Desconocido',
          version: dto.version,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new UnauthorizedException('Tu sesión ya no es válida. Inicia sesión nuevamente.');
      }
      throw error;
    }
  }

  async findAllLogs() {
    return this.prisma.lopdpLog.findMany({
      orderBy: { acceptedAt: 'desc' },
      include: {
        user: {
          select: {
            role: true,
          }
        }
      }
    });
  }

  async createArcoRequest(userId: string, dto: ArcoRequestDto) {
    return this.prisma.dataRequest.create({
      data: {
        userId,
        type: dto.type,
        details: dto.details,
        status: 'PENDIENTE',
      },
    });
  }

  async getUserDataSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignmentsAsStudent: {
          include: {
            company: true,
            attendances: true,
            documents: true,
          }
        },
        assignmentsAsTutor: {
          include: {
            student: true,
            company: true,
          }
        },
        dataRequests: true,
      }
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    // Aquí preparamos la estructura JSON para la "Portabilidad"
    return {
      personalInfo: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        privacyConsent: {
          accepted: user.lopdpAccepted,
          acceptedAt: user.lopdpAcceptedAt,
          version: user.lopdpVersion,
        }
      },
      academicHistory: user.assignmentsAsStudent.map(a => ({
        company: a.company.name,
        startDate: a.startDate,
        hours: a.totalHours,
        status: a.status,
        attendancesCount: a.attendances.length,
        documents: a.documents.map(d => ({ name: d.name, status: d.status })),
      })),
      rightsRequests: user.dataRequests,
      // RF-LOPDP Art. 18 & 20: incluir historial de chat en la portabilidad de datos
      chatHistory: await this.chatService.getChatDataExport(userId),
      exportTimestamp: new Date().toISOString(),
      institution: "ISTPET - Instituto Superior Tecnológico Mayor Pedro Traversari",
      legalNotice: "Exportación de datos personales conforme al Art. 18 y 20 de la Ley Orgánica de Protección de Datos Personales (LOPDP) de Ecuador.",
    };
  }

  async getMyRequests(userId: string) {
    return this.prisma.dataRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Métodos Administrativos (LOPDP) ────────────────────────────────────────

  async findAllRequests() {
    return this.prisma.dataRequest.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async respondToRequest(requestId: string, response: string, status: string) {
    const request = await this.prisma.dataRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud ARCO no encontrada.');
    }

    const validStatuses = ['PENDIENTE', 'EN_REVISION', 'COMPLETADA', 'RECHAZADA'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Estado de solicitud no válido.');
    }

    const updated = await this.prisma.dataRequest.update({
      where: { id: requestId },
      data: { response, status, updatedAt: new Date() },
      include: { user: true },
    });

    // RF-LOPDP Art. 22: si se aprueba una solicitud de CANCELACION,
    // anonimizar automáticamente los mensajes de chat del usuario.
    if (
      request.type === 'CANCELACION' &&
      status === 'COMPLETADA'
    ) {
      await this.chatService.anonymizeUserChatData(request.userId);
    }

    return updated;
  }
}
