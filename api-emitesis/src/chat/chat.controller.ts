import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ── Admin: gestión de permisos ────────────────────────────────────────────

  @Get('permissions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos los permisos de chat entre roles (solo ADMIN)' })
  getPermissions() {
    return this.chatService.getAllPermissions();
  }

  @Patch('permissions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activar o desactivar chat entre un par de roles (solo ADMIN)' })
  updatePermission(
    @Body() body: any,
  ) {
    if (Array.isArray(body)) {
      return this.chatService.updatePermissionsBulk(body);
    }
    return this.chatService.updatePermission(body.fromRole, body.toRole, body.isEnabled);
  }

  // ── Salas y mensajes ──────────────────────────────────────────────────────

  @Get('rooms')
  @ApiOperation({ summary: 'Salas de chat del usuario autenticado' })
  getRooms(@Request() req: any) {
    return this.chatService.getUserRooms(req.user.id);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Historial de mensajes de una sala (paginado)' })
  getMessages(
    @Param('roomId') roomId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Request() req: any,
  ) {
    return this.chatService.getRoomMessages(roomId, req.user.id, +page, +limit);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Total de mensajes no leídos del usuario autenticado' })
  getUnread(@Request() req: any) {
    return this.chatService.getUnreadCount(req.user.id).then(count => ({ count }));
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Usuarios con quienes el rol actual puede chatear' })
  getContacts(@Request() req: any) {
    return this.chatService.getContacts(req.user.id, req.user.role);
  }

  // ── RF-LOPDP: Derechos del titular ───────────────────────────────────────

  /**
   * Art. 22 LOPDP — Derecho de cancelación (remitente).
   * Permite al usuario eliminar su propio mensaje dentro de las 24 horas siguientes al envío.
   * El contenido se sustituye por un marcador; la referencia del hilo se conserva.
   */
  @Delete('messages/:id')
  @ApiOperation({ summary: 'Eliminar mensaje propio (Art. 22 LOPDP — ventana de 24 h)' })
  deleteMessage(@Param('id') id: string, @Request() req: any) {
    return this.chatService.softDeleteMessage(id, req.user.id);
  }

  /**
   * Art. 18 & 20 LOPDP — Acceso y portabilidad del historial de chat.
   * Devuelve un resumen exportable de toda la actividad de chat del usuario autenticado.
   */
  @Get('my-data')
  @ApiOperation({ summary: 'Exportar historial de chat del usuario (Art. 18-20 LOPDP)' })
  getChatData(@Request() req: any) {
    return this.chatService.getChatDataExport(req.user.id);
  }
}
