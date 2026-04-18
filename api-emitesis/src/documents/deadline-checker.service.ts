import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * RF-09: Bloqueo Automático por Incumplimiento.
 * Cron job que se ejecuta diariamente a medianoche y marca como INCUMPLIDO
 * todo documento cuya fecha límite haya pasado sin que el estudiante haya subido el archivo.
 * También notifica de inmediato al tutor académico responsable.
 */
@Injectable()
export class DeadlineCheckerService {
  private readonly logger = new Logger(DeadlineCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkExpiredDocuments() {
    this.logger.log('RF-09: Verificando documentos con plazo vencido...');

    const now = new Date();

    // Buscar documentos que:
    // 1. Tienen fecha límite configurada y ya venció
    // 2. Nunca se subió un archivo (filePath es null)
    // 3. Su estado todavía es PENDIENTE (no INCUMPLIDO ni aprobado)
    const expiredDocs = await this.prisma.document.findMany({
      where: {
        dueDate: { lt: now },
        filePath: null,
        status: 'PENDIENTE',
      },
      include: {
        internship: {
          include: {
            student: true,
            tutor: true,
          },
        },
      },
    });

    if (expiredDocs.length === 0) {
      this.logger.log('RF-09: No hay documentos vencidos sin entregar.');
      return;
    }

    this.logger.log(`RF-09: Se encontraron ${expiredDocs.length} documentos incumplidos.`);

    for (const doc of expiredDocs) {
      try {
        // Marcar como INCUMPLIDO
        await this.prisma.document.update({
          where: { id: doc.id },
          data: { status: 'INCUMPLIDO' },
        });

        // Notificar al estudiante vía app
        await this.notificationsService.createInApp(
          doc.internship.studentId,
          `Documento Incumplido: ${doc.name}`,
          `El plazo para entregar este documento ha vencido y se ha marcado como INCUMPLIDO.`,
          'ERROR',
          '/dashboard/documentos'
        );

        this.logger.log(
          `RF-09: Documento "${doc.name}" del estudiante "${doc.internship.student.fullName}" marcado como INCUMPLIDO.`,
        );
      } catch (err: any) {
        this.logger.error(`RF-09: Error procesando documento ${doc.id}: ${err.message}`);
      }
    }
  }
}
