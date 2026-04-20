import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private systemLogs: SystemLogsService,
  ) {}

  /**
   * Corre todos los días a la medianoche (00:00).
   * RF-AUTO-01: Identificar documentos vencidos y marcarlos como INCUMPLIDO.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueDocuments() {
    this.logger.log('Iniciando motor de cumplimiento autónomo (Overdue Documents)...');

    const now = new Date();

    // Buscar documentos que:
    // 1. Estén en estado PENDIENTE
    // 2. Tengan un dueDate definido
    // 3. El dueDate sea anterior a ahora
    const overdueDocs = await this.prisma.document.findMany({
      where: {
        status: 'PENDIENTE',
        dueDate: { lt: now },
      },
      include: {
        internship: {
          select: { studentId: true, student: { select: { fullName: true } } }
        }
      }
    });

    if (overdueDocs.length === 0) {
      this.logger.log('No se encontraron documentos vencidos.');
      return;
    }

    this.logger.warn(`Detectados ${overdueDocs.length} documentos vencidos. Procesando...`);

    for (const doc of overdueDocs) {
      try {
        await this.prisma.document.update({
          where: { id: doc.id },
          data: { status: 'INCUMPLIDO' },
        });

        // Notificar al estudiante
        await this.notifications.createInApp(
          doc.internship.studentId,
          'Documento Vencido',
          `El plazo para subir "${doc.name}" ha finalizado. El estado ha cambiado a INCUMPLIDO.`,
          'ERROR',
          '/dashboard/documentos'
        );

        this.systemLogs.append({
          level: 'WARN',
          category: 'SYSTEM',
          message: `Auto-Marcado INCUMPLIDO: Documento "${doc.name}" del estudiante ${doc.internship.student.fullName}`,
          userId: doc.internship.studentId,
          metadata: { documentId: doc.id, reason: 'AUTO_COMPLIANCE_TIMEOUT' }
        });

      } catch (error) {
        this.logger.error(`Error procesando documento ${doc.id}: ${error.message}`);
      }
    }

    this.logger.log('Motor de cumplimiento finalizado.');
  }
}
