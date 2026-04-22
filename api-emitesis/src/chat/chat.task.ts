import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatService } from './chat.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

/**
 * RF-LOPDP Art. 16 — Principio de limitación del plazo de conservación.
 *
 * Tarea programada que ejecuta diariamente a las 03:00 la purgación de
 * mensajes de chat que superan el período de retención configurado en
 * SystemSetting (clave: chat_message_retention_days, por defecto 730 días).
 *
 * Los mensajes se eliminan de forma permanente (no reversible) conforme
 * al principio de minimización del Art. 6 LOPDP Ecuador.
 */
@Injectable()
export class ChatTask {
  private readonly logger = new Logger('ChatTask');

  constructor(
    private readonly chatService: ChatService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async runRetentionPurge() {
    const retentionDays = await this.chatService.getRetentionDays();
    this.logger.log(`[LOPDP] Iniciando purgado de mensajes > ${retentionDays} días...`);

    const deleted = await this.chatService.purgeMessagesOlderThan(retentionDays);

    await this.systemLogs.append({
      level: 'INFO',
      category: 'PRIVACY',
      message: `[LOPDP-Retención] Purgado automático de chat: ${deleted} mensajes eliminados (retención: ${retentionDays} días)`,
      path: 'CRON /chat/retention-purge',
      metadata: { retentionDays, deletedCount: deleted, executedAt: new Date().toISOString() },
    });

    this.logger.log(`[LOPDP] Purgado completado: ${deleted} mensajes eliminados.`);
  }
}
