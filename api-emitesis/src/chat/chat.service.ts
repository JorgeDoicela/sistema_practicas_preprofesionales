import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

/** Placeholder que sustituye el contenido cuando un mensaje es borrado o anonimizado. */
export const DELETED_CONTENT = '[Mensaje eliminado]';
export const ANONYMIZED_CONTENT = '[Contenido eliminado — solicitud de privacidad LOPDP]';

/** Ventana en horas dentro de la cual el remitente puede borrar su propio mensaje (Art. 22 LOPDP). */
const SELF_DELETE_WINDOW_HOURS = 24;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Permisos ──────────────────────────────────────────────────────────────

  async getAllPermissions() {
    return this.prisma.chatPermission.findMany({
      orderBy: [{ fromRole: 'asc' }, { toRole: 'asc' }],
    });
  }

  async updatePermission(fromRole: Role, toRole: Role, isEnabled: boolean) {
    // Actualizar ambas direcciones para mantener simetría
    await this.prisma.chatPermission.upsert({
      where: { fromRole_toRole: { fromRole: toRole, toRole: fromRole } },
      create: { fromRole: toRole, toRole: fromRole, isEnabled },
      update: { isEnabled },
    });
    return this.prisma.chatPermission.upsert({
      where: { fromRole_toRole: { fromRole, toRole } },
      create: { fromRole, toRole, isEnabled },
      update: { isEnabled },
    });
  }

  async canRolesCommunicate(roleA: Role, roleB: Role): Promise<boolean> {
    const perm = await this.prisma.chatPermission.findFirst({
      where: {
        OR: [
          { fromRole: roleA, toRole: roleB, isEnabled: true },
          { fromRole: roleB, toRole: roleA, isEnabled: true },
        ],
      },
    });
    return !!perm;
  }

  // ── Salas ─────────────────────────────────────────────────────────────────

  async getOrCreateDirectRoom(userIdA: string, userIdB: string): Promise<string> {
    // 0. Seguridad Enterprise: Verificar permisos de rol antes de crear
    const [userA, userB] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userIdA }, select: { role: true } }),
      this.prisma.user.findUnique({ where: { id: userIdB }, select: { role: true } }),
    ]);

    if (!userA || !userB) throw new BadRequestException('Uno de los usuarios no existe');

    const canChat = await this.canRolesCommunicate(userA.role, userB.role);
    if (!canChat) {
      throw new ForbiddenException(`La comunicación entre ${userA.role} y ${userB.role} no está permitida por el administrador.`);
    }

    // Sala 1:1 entre exactamente esos dos usuarios
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userIdA } } },
          { members: { some: { userId: userIdB } } },
        ],
      },
      include: { members: { select: { userId: true } } },
    });

    const exact = rooms.find(r => r.members.length === 2);
    if (exact) return exact.id;

    const room = await this.prisma.chatRoom.create({
      data: {
        isGroup: false,
        members: { create: [{ userId: userIdA }, { userId: userIdB }] },
      },
    });
    return room.id;
  }

  async getUserRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, role: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, fullName: true } } },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Calcular no leídos por sala en una sola query
    const roomIds = rooms.map(r => r.id);
    const unreadGroups = await this.prisma.chatMessage.groupBy({
      by: ['roomId'],
      where: {
        roomId: { in: roomIds },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadGroups.map(g => [g.roomId, g._count.id]));

    return rooms
      .map(room => ({
        id: room.id,
        isGroup: room.isGroup,
        name: room.name,
        members: room.members.map(m => m.user),
        lastMessage: room.messages[0] ?? null,
        unreadCount: unreadMap.get(room.id) ?? 0,
      }))
      .sort((a, b) => {
        const tA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const tB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return tB - tA;
      });
  }

  // ── Mensajes ──────────────────────────────────────────────────────────────

  async saveMessage(roomId: string, senderId: string, content: string) {
    return this.prisma.chatMessage.create({
      data: { roomId, senderId, content },
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async getRoomMessages(roomId: string, userId: string, page = 1, limit = 50) {
    const isMember = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!isMember) throw new ForbiddenException('No eres miembro de esta sala.');

    const skip = (page - 1) * limit;
    return this.prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  async markMessagesRead(roomId: string, userId: string) {
    await this.prisma.chatMessage.updateMany({
      where: { roomId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const memberRooms = await this.prisma.chatRoomMember.findMany({
      where: { userId },
      select: { roomId: true },
    });
    const roomIds = memberRooms.map(m => m.roomId);
    if (roomIds.length === 0) return 0;
    return this.prisma.chatMessage.count({
      where: {
        roomId: { in: roomIds },
        senderId: { not: userId },
        readAt: null,
      },
    });
  }

  // ── Contactos contextuales ────────────────────────────────────────────────
  /**
   * Devuelve la lista de usuarios con quienes el solicitante puede chatear,
   * considerando tanto los permisos de rol como las relaciones reales del sistema
   * (asignaciones de prácticas), para evitar listas de cientos de usuarios.
   */
  async getContacts(userId: string, userRole: Role) {
    // 1. Obtener roles permitidos para este rol
    const enabledPerms = await this.prisma.chatPermission.findMany({
      where: {
        isEnabled: true,
        OR: [{ fromRole: userRole }, { toRole: userRole }],
      },
    });
    const allowedRoles = new Set<Role>();
    for (const perm of enabledPerms) {
      if (perm.fromRole === userRole) allowedRoles.add(perm.toRole);
      if (perm.toRole === userRole) allowedRoles.add(perm.fromRole);
    }
    if (allowedRoles.size === 0) return [];

    // 2. Según el rol, restringir a usuarios relevantes de las prácticas
    switch (userRole) {
      case Role.ESTUDIANTE:
        return this.getContactsForStudent(userId, allowedRoles);
      case Role.TUTOR:
        return this.getContactsForTutor(userId, allowedRoles);
      case Role.EMPRESA:
        return this.getContactsForEmpresa(userId, allowedRoles);
      case Role.COORDINADOR:
        return this.getContactsForCoordinador(userId, allowedRoles);
      case Role.ADMIN:
      default:
        return this.getAllowedUsers(userId, allowedRoles);
    }
  }

  /** ESTUDIANTE: su tutor asignado + coordinadores (no todos los tutores del sistema) */
  private async getContactsForStudent(userId: string, allowedRoles: Set<Role>) {
    const internship = await this.prisma.internship.findFirst({
      where: { studentId: userId, status: { in: ['En Proceso', 'Activo'] } },
      include: {
        tutor: { select: { id: true, fullName: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const specificIds = new Set<string>();
    const contacts: { id: string; fullName: string; role: Role; email: string; context?: string }[] = [];

    if (internship?.tutor && allowedRoles.has(internship.tutor.role)) {
      specificIds.add(internship.tutor.id);
      contacts.push({ ...internship.tutor, context: 'Tutor Académico Asignado' });
    }

    // Coordinadores
    if (allowedRoles.has(Role.COORDINADOR)) {
      const coordinadores = await this.prisma.user.findMany({
        where: { role: Role.COORDINADOR, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const c of coordinadores) {
        if (!specificIds.has(c.id)) {
          contacts.push({ ...c, context: 'Coordinación' });
        }
      }
    }

    // ADMIN
    if (allowedRoles.has(Role.ADMIN)) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const a of admins) contacts.push({ ...a, context: 'Administración' });
    }

    return contacts;
  }

  /** TUTOR: sus estudiantes activos asignados + coordinadores */
  private async getContactsForTutor(userId: string, allowedRoles: Set<Role>) {
    const contacts: { id: string; fullName: string; role: Role; email: string; context?: string }[] = [];
    const seen = new Set<string>();

    if (allowedRoles.has(Role.ESTUDIANTE)) {
      const internships = await this.prisma.internship.findMany({
        where: { tutorId: userId, status: { in: ['En Proceso', 'Activo'] } },
        include: {
          student: { select: { id: true, fullName: true, role: true, email: true } },
          company: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      for (const i of internships) {
        if (!seen.has(i.student.id)) {
          seen.add(i.student.id);
          contacts.push({ ...i.student, context: `Practicante en ${i.company.name}` });
        }
      }
    }

    if (allowedRoles.has(Role.COORDINADOR)) {
      const coordinadores = await this.prisma.user.findMany({
        where: { role: Role.COORDINADOR, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const c of coordinadores) contacts.push({ ...c, context: 'Coordinación' });
    }

    if (allowedRoles.has(Role.ADMIN)) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const a of admins) contacts.push({ ...a, context: 'Administración' });
    }

    return contacts;
  }


  /** EMPRESA: estudiantes asignados a la empresa + coordinadores */
  private async getContactsForEmpresa(userId: string, allowedRoles: Set<Role>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });
    return this.getContactsForCompanyRole(userId, user?.companyId ?? null, allowedRoles);
  }

  private async getContactsForCompanyRole(
    userId: string,
    companyId: string | null,
    allowedRoles: Set<Role>,
  ) {
    const contacts: { id: string; fullName: string; role: Role; email: string; context?: string }[] = [];
    const seen = new Set<string>();

    if (companyId && allowedRoles.has(Role.ESTUDIANTE)) {
      const internships = await this.prisma.internship.findMany({
        where: { companyId, status: { in: ['En Proceso', 'Activo'] } },
        include: {
          student: { select: { id: true, fullName: true, role: true, email: true } },
          company: { select: { name: true } },
        },
      });
      for (const i of internships) {
        if (!seen.has(i.student.id)) {
          seen.add(i.student.id);
          contacts.push({ ...i.student, context: `Practicante en ${i.company.name}` });
        }
      }
    }

    if (allowedRoles.has(Role.TUTOR)) {
      const tutores = await this.prisma.user.findMany({
        where: { role: Role.TUTOR, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const t of tutores) {
        if (!seen.has(t.id)) contacts.push({ ...t, context: 'Tutor Académico' });
      }
    }

    if (allowedRoles.has(Role.COORDINADOR)) {
      const coordinadores = await this.prisma.user.findMany({
        where: { role: Role.COORDINADOR, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const c of coordinadores) contacts.push({ ...c, context: 'Coordinación' });
    }

    if (allowedRoles.has(Role.ADMIN)) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const a of admins) contacts.push({ ...a, context: 'Administración' });
    }

    return contacts;
  }

  /** COORDINADOR: todos los tutores + todos los estudiantes con práctica activa */
  private async getContactsForCoordinador(userId: string, allowedRoles: Set<Role>) {
    const contacts: { id: string; fullName: string; role: Role; email: string; context?: string }[] = [];

    if (allowedRoles.has(Role.TUTOR)) {
      const tutores = await this.prisma.user.findMany({
        where: { role: Role.TUTOR, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const t of tutores) contacts.push({ ...t, context: 'Tutor Académico' });
    }

    if (allowedRoles.has(Role.ESTUDIANTE)) {
      const activeStudentIds = await this.prisma.internship.findMany({
        where: { status: { in: ['En Proceso', 'Activo'] } },
        select: { studentId: true },
        distinct: ['studentId'],
      });
      const ids = activeStudentIds.map(i => i.studentId);
      if (ids.length > 0) {
        const students = await this.prisma.user.findMany({
          where: { id: { in: ids }, isActive: true },
          select: { id: true, fullName: true, role: true, email: true },
          orderBy: { fullName: 'asc' },
        });
        for (const s of students) contacts.push({ ...s, context: 'Estudiante en Práctica' });
      }
    }

    if (allowedRoles.has(Role.EMPRESA)) {
      const empresas = await this.prisma.user.findMany({
        where: { role: Role.EMPRESA, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const e of empresas) contacts.push({ ...e, context: 'Empresa' });
    }

    if (allowedRoles.has(Role.ADMIN)) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true, id: { not: userId } },
        select: { id: true, fullName: true, role: true, email: true },
        orderBy: { fullName: 'asc' },
      });
      for (const a of admins) contacts.push({ ...a, context: 'Administración' });
    }

    return contacts;
  }

  /** Fallback: todos los usuarios de roles permitidos (ADMIN) */
  private async getAllowedUsers(userId: string, allowedRoles: Set<Role>) {
    if (allowedRoles.size === 0) return [];
    return this.prisma.user.findMany({
      where: { id: { not: userId }, isActive: true, role: { in: [...allowedRoles] } },
      select: { id: true, fullName: true, role: true, email: true },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ██ RF-LOPDP: Cumplimiento Ley Orgánica de Protección de Datos (Ecuador)  ██
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Art. 22 LOPDP — Derecho de cancelación/supresión (remitente).
   * El remitente puede eliminar su propio mensaje dentro de la ventana permitida.
   * El mensaje queda con contenido censurado para preservar la coherencia del hilo.
   */
  async softDeleteMessage(messageId: string, requesterId: string) {
    const msg = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new ForbiddenException('Mensaje no encontrado.');
    if (msg.senderId !== requesterId) {
      throw new ForbiddenException('Solo puedes eliminar tus propios mensajes.');
    }
    if (msg.deletedAt || msg.isAnonymized) {
      throw new BadRequestException('El mensaje ya fue eliminado.');
    }
    const hoursElapsed = (Date.now() - msg.createdAt.getTime()) / 3_600_000;
    if (hoursElapsed > SELF_DELETE_WINDOW_HOURS) {
      throw new ForbiddenException(
        `Solo puedes eliminar mensajes enviados en las últimas ${SELF_DELETE_WINDOW_HOURS} horas (Art. 22 LOPDP).`,
      );
    }
    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { content: DELETED_CONTENT, deletedAt: new Date() },
      include: { sender: { select: { id: true, fullName: true, role: true } } },
    });
  }

  /**
   * Art. 22 LOPDP — Anonimización por solicitud ARCO-Cancelación.
   * Se invoca desde PrivacyService cuando un administrador aprueba la solicitud de cancelación.
   * El historial se conserva (integridad del hilo) pero el contenido y la vinculación al usuario
   * se eliminan para proteger su privacidad.
   */
  async anonymizeUserChatData(userId: string): Promise<{ messagesAnonymized: number; roomsLeft: number }> {
    // 1. Anonimizar contenido de todos los mensajes del usuario
    const { count: messagesAnonymized } = await this.prisma.chatMessage.updateMany({
      where: { senderId: userId, isAnonymized: false },
      data: {
        content: ANONYMIZED_CONTENT,
        isAnonymized: true,
        deletedAt: new Date(),
      },
    });

    // 2. Eliminar al usuario de todas las salas
    const { count: roomsLeft } = await this.prisma.chatRoomMember.deleteMany({
      where: { userId },
    });

    return { messagesAnonymized, roomsLeft };
  }

  /**
   * Art. 18 & 20 LOPDP — Derecho de acceso y portabilidad.
   * Devuelve un resumen exportable de toda la actividad de chat del usuario.
   * Utilizado por PrivacyService en GET /privacy/my-data.
   */
  async getChatDataExport(userId: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { senderId: userId, isAnonymized: false },
      orderBy: { createdAt: 'asc' },
      include: {
        room: {
          include: {
            members: {
              include: { user: { select: { fullName: true, role: true } } },
            },
          },
        },
      },
    });

    const rooms = await this.prisma.chatRoom.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { fullName: true, role: true } } } },
        _count: { select: { messages: true } },
      },
    });

    return {
      totalMessagesSent: messages.length,
      totalConversations: rooms.length,
      conversations: rooms.map(r => ({
        roomId: r.id,
        participants: r.members.map(m => ({
          fullName: m.user.fullName,
          role: m.user.role,
        })),
        totalMessages: r._count.messages,
        joinedAt: r.createdAt,
      })),
      messages: messages.map(m => ({
        sentAt: m.createdAt,
        content: m.content,
        readAt: m.readAt,
        deletedAt: m.deletedAt,
        participants: m.room.members.map(mb => ({
          fullName: mb.user.fullName,
          role: mb.user.role,
        })),
      })),
      retentionPolicy: `Los mensajes se conservan ${SELF_DELETE_WINDOW_HOURS}h tras su envío para supresión voluntaria. La retención máxima es configurable por el administrador (SystemSetting: chat_message_retention_days).`,
      legalBasis: 'Interés legítimo institucional — seguimiento de prácticas preprofesionales (Art. 7 LOPDP Ecuador)',
      exportTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Art. 16 LOPDP — Principio de limitación del plazo de conservación.
   * Elimina permanentemente mensajes que superan el período de retención configurado.
   * Invocado por ChatTask diariamente.
   */
  async purgeMessagesOlderThan(retentionDays: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const { count } = await this.prisma.chatMessage.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return count;
  }

  /**
   * Obtiene el valor de retención en días desde SystemSetting.
   * Valor por defecto: 730 días (2 años, período estándar para registros académicos en Ecuador).
   */
  async getRetentionDays(): Promise<number> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'chat_message_retention_days' },
    });
    const parsed = parseInt(setting?.value ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 730;
  }
}
