import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { SystemLogsService } from '../system-logs/system-logs.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: 'chat',
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('ChatGateway');

  /** userId → Set de socketIds activos (permite múltiples pestañas) */
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token =
      (client.handshake.query.token as string) ||
      (client.handshake.auth?.token as string);

    if (!token) { client.disconnect(); return; }

    try {
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub ?? payload.id;
      client.userRole = payload.role;

      if (!client.userId) { client.disconnect(); return; }

      client.join(`user:${client.userId}`);

      // Registrar presencia
      if (!this.onlineUsers.has(client.userId)) {
        this.onlineUsers.set(client.userId, new Set());
      }
      this.onlineUsers.get(client.userId)!.add(client.id);

      // Notificar a todos (broadcast de presencia)
      this.server.emit('userStatusChange', { userId: client.userId, online: true });

      // Re-unir al socket a las salas existentes del usuario
      const rooms = await this.chatService.getUserRooms(client.userId);
      for (const room of rooms) {
        client.join(room.id);
      }

      this.logger.log(`Chat connected: userId=${client.userId} role=${client.userRole}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const sockets = this.onlineUsers.get(client.userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(client.userId);
          this.server.emit('userStatusChange', { userId: client.userId, online: false });
        }
      }
    }
    this.logger.log(`Chat disconnected: ${client.id}`);
  }

  /** Devuelve la lista actual de usuarios en línea */
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    return { onlineUserIds: [...this.onlineUsers.keys()] };
  }

  // ── joinRoom ──────────────────────────────────────────────────────────────

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string },
  ) {
    const { userId, userRole } = client;
    if (!userId || !userRole) throw new WsException('No autenticado.');

    const target = await this.prisma.user.findUnique({
      where: { id: data.targetUserId },
      select: { id: true, role: true },
    });
    if (!target) throw new WsException('Usuario destino no encontrado.');

    const allowed = await this.chatService.canRolesCommunicate(
      userRole as any,
      target.role,
    );
    if (!allowed) throw new WsException('No tienes permiso para chatear con este usuario.');

    const roomId = await this.chatService.getOrCreateDirectRoom(userId, target.id);
    client.join(roomId);

    // Si el destinatario está online, añadirlo también a la sala
    const targetSockets = await this.server.in(`user:${target.id}`).fetchSockets();
    for (const s of targetSockets) s.join(roomId);

    const history = await this.chatService.getRoomMessages(roomId, userId);
    return { roomId, history };
  }

  // ── sendMessage ───────────────────────────────────────────────────────────

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; content: string },
  ) {
    const { userId, userRole } = client;
    if (!userId || !userRole) throw new WsException('No autenticado.');
    if (!data.content?.trim()) throw new WsException('El mensaje no puede estar vacío.');

    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: data.roomId, userId } },
      include: {
        room: { include: { members: { select: { userId: true } } } },
      },
    });
    if (!member) throw new WsException('No eres miembro de esta sala.');

    // Verificar que el permiso de rol sigue activo
    const otherMemberIds = member.room.members
      .map(m => m.userId)
      .filter(id => id !== userId);

    if (!member.room.isGroup && otherMemberIds.length === 1) {
      const otherUser = await this.prisma.user.findUnique({
        where: { id: otherMemberIds[0] },
        select: { role: true },
      });
      if (otherUser) {
        const allowed = await this.chatService.canRolesCommunicate(
          userRole as any,
          otherUser.role,
        );
        if (!allowed) throw new WsException('Los permisos de chat han sido revocados.');
      }
    }

    const message = await this.chatService.saveMessage(data.roomId, userId, data.content.trim());

    // RF-LOPDP Art. 37: registrar tratamiento de dato personal (mensaje de chat)
    this.systemLogs.append({
      level: 'INFO',
      category: 'SYSTEM',
      message: `[CHAT] Mensaje enviado — sala ${data.roomId}`,
      path: 'WS /chat#sendMessage',
      userId,
      metadata: { roomId: data.roomId, messageId: message.id },
    });

    // Limpiar indicador de typing del remitente
    this.server.to(data.roomId).emit('stopTyping', { userId, roomId: data.roomId });

    this.server.to(data.roomId).emit('newMessage', message);
    return message;
  }

  // ── markRead ──────────────────────────────────────────────────────────────

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    const { userId } = client;
    if (!userId) throw new WsException('No autenticado.');
    await this.chatService.markMessagesRead(data.roomId, userId);
    // Notificar a otros miembros que los mensajes fueron leídos
    client.to(data.roomId).emit('messagesRead', { roomId: data.roomId, byUserId: userId });
    return { ok: true };
  }

  // ── typing ────────────────────────────────────────────────────────────────

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) return;
    client.to(data.roomId).emit('typing', {
      userId: client.userId,
      roomId: data.roomId,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) return;
    client.to(data.roomId).emit('stopTyping', {
      userId: client.userId,
      roomId: data.roomId,
    });
  }
}
