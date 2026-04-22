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

  /**
   * Corre cada día a las 08:00.
   * RF-AUTO-02: Alertar convenios que vencen en los próximos 30 días.
   */
  @Cron('0 8 * * *')
  async handleExpiringAgreements() {
    this.logger.log('Verificando convenios próximos a vencer...');

    const now = new Date();
    const in30days = new Date(now);
    in30days.setDate(in30days.getDate() + 30);

    const expiring = await this.prisma.agreement.findMany({
      where: {
        status: 'Activo',
        endDate: { gte: now, lte: in30days },
      },
      include: { company: true },
    });

    if (expiring.length === 0) {
      this.logger.log('No hay convenios próximos a vencer.');
      return;
    }

    const coordinators = await this.prisma.user.findMany({
      where: { role: 'COORDINADOR', isActive: true },
      select: { id: true },
    });

    for (const agreement of expiring) {
      const daysLeft = Math.ceil((agreement.endDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      for (const coord of coordinators) {
        await this.notifications.createInApp(
          coord.id,
          'Convenio próximo a vencer',
          `El convenio con "${agreement.company.name}" vence en ${daysLeft} día(s). Considere renovarlo.`,
          'WARNING',
          '/coordinador/convenios',
        );
      }

      this.systemLogs.append({
        level: 'WARN',
        category: 'SYSTEM',
        message: `Convenio próximo a vencer: ${agreement.company.name} — ${daysLeft} día(s)`,
        metadata: { agreementId: agreement.id, companyId: agreement.companyId, daysLeft },
      });
    }

    this.logger.log(`Alertas enviadas para ${expiring.length} convenio(s).`);
  }

  /**
   * Corre cada día a las 09:00.
   * RF-AUTO-03: Marcar convenios vencidos como "Vencido".
   */
  @Cron('0 9 * * *')
  async handleExpiredAgreements() {
    const now = new Date();
    const result = await this.prisma.agreement.updateMany({
      where: { status: 'Activo', endDate: { lt: now } },
      data: { status: 'Vencido' },
    });
    if (result.count > 0) {
      this.logger.warn(`${result.count} convenio(s) marcados como Vencido automáticamente.`);
    }
  }
}
