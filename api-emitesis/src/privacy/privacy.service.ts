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

  async recordConsent(userId: string, dto: PrivacyConsentDto) {
    if (!dto.accepted) {
      throw new BadRequestException('Debe aceptar la política de privacidad para continuar.');
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          lopdpAccepted: true,
          lopdpAcceptedAt: new Date(),
          lopdpVersion: dto.version,
        },
      });
    } catch (error) {
      // Si el token contiene un userId obsoleto (p.ej. después de un reseed), forzar re-login.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new UnauthorizedException('Tu sesión ya no es válida. Inicia sesión nuevamente.');
      }
      throw error;
    }
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

    const updated = await this.prisma.dataRequest.update({
      where: { id: requestId },
      data: { response, status, updatedAt: new Date() },
      include: { user: true },
    });

    // RF-LOPDP Art. 22: si se aprueba una solicitud de CANCELACION,
    // anonimizar automáticamente los mensajes de chat del usuario.
    if (
      request &&
      request.type === 'CANCELACION' &&
      status === 'COMPLETADA'
    ) {
      await this.chatService.anonymizeUserChatData(request.userId);
    }

    return updated;
  }
}
