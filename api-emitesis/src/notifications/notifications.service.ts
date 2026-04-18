import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RF-NOTIF-01: Centro de Notificaciones In-App.
 * Gestiona alertas internas que el usuario ve directamente en el Dashboard.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una notificación interna para un usuario específico.
   */
  async createInApp(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO', link?: string) {
    try {
      return await this.prisma.inAppNotification.create({
        data: {
          userId,
          title,
          message,
          type,
          link,
        },
      });
    } catch (err: any) {
      this.logger.error(`Error creando notificación In-App para ${userId}: ${err.message}`);
    }
  }

  /**
   * Obtiene las notificaciones más recientes de un usuario.
   */
  async findAllForUser(userId: string, limit = 10) {
    return this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Marca una notificación como leída.
   */
  async markAsRead(id: string) {
    return this.prisma.inAppNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas.
   */
  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Cuenta las notificaciones no leídas.
   */
  async countUnread(userId: string) {
    return this.prisma.inAppNotification.count({
      where: { userId, isRead: false },
    });
  }
}
