import { Controller, Get, Post, Patch, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Obtener mis notificaciones recientes' })
  @Get('my')
  async getMyNotifications(@Req() req: any) {
    return this.notificationsService.findAllForUser(req.user.id);
  }

  @ApiOperation({ summary: 'Contar notificaciones no leídas' })
  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationsService.countUnread(req.user.id);
    return { count };
  }

  @ApiOperation({ summary: 'Marcar una notificación como leída' })
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  @Post('read-all')
  async markAllAsRead(@Req() req: any) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }
}
