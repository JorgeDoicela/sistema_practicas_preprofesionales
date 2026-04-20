import { Injectable, Logger } from '@nestjs/common';
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
  async signDocument(documentId: string, signerId: string, reason: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { internship: { include: { student: true } } }
    });

    if (!document) throw new Error('Documento no encontrado');

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
