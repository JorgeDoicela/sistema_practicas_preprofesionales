import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';
import * as crypto from 'crypto';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  /**
   * Simula la orquestación de una firma electrónica institucional.
   * En producción, esto se conectaría con un HSM o servicio de firma PKCS#12.
   */
  async signDocument(documentId: string, signerId: string, reason: string, careerId?: string | null) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { internship: { include: { student: true } } }
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    // RF-SIG-001: Validar carrera del coordinador si aplica
    if (careerId && document.internship.careerId !== careerId) {
      throw new ForbiddenException('No tienes permiso para firmar documentos de otra carrera');
    }

    if (document.status !== 'APROBADO_TUTOR') {
      throw new BadRequestException('El documento debe estar aprobado por el tutor antes de ser firmado electrónicamente');
    }

    if (!document.filePath) {
      throw new BadRequestException('El documento no contiene ningún archivo subido para firmar');
    }

    // RF-SIG-002: Generar un "Sello de Veracidad" (Hash institucional)
    const signatureKey = crypto
      .createHash('sha256')
      .update(`${document.id}-${signerId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const updated = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        isDigitallySigned: true,
        signatureDate: new Date(),
        signatureKey: `ISTPET-SIG-${signatureKey}`,
        status: 'APROBADO_DEFINITIVO',
        reviewedAt: new Date(),
      },
    });

    this.systemLogs.append({
      level: 'INFO',
      category: 'SYSTEM',
      message: `Documento firmado electrónicamente: ${document.name}`,
      userId: signerId,
      metadata: { 
        documentId, 
        signatureKey: updated.signatureKey, 
        reason,
        student: document.internship.student.fullName 
      }
    });

    return updated;
  }
}
