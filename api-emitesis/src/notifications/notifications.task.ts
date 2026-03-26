import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsTask {
  private readonly logger = new Logger(NotificationsTask.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Se ejecuta todos los días a las 08:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleUpcomingDeadlines() {
    this.logger.log('Iniciando verificación de plazos de entrega (24h)...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Buscar documentos que vencen mañana
    const documents = await this.prisma.document.findMany({
      where: {
        status: 'PENDIENTE',
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      include: {
        internship: {
          include: {
            student: true,
          },
        },
      },
    });

    this.logger.log(`Se encontraron ${documents.length} documentos próximos a vencer.`);

    for (const doc of documents) {
      if (doc.internship.student.email) {
        await this.emailService.sendDeadlineReminder(
          doc.internship.student.email,
          doc.internship.student.fullName,
          doc.name,
          doc.dueDate!
        );
      }
    }
  }
}
