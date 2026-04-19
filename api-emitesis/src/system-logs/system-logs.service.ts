import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const MAX_MESSAGE = 2000;
const MAX_PATH = 500;

export type SystemLogLevel = 'INFO' | 'WARN' | 'ERROR';
export type SystemLogCategory = 'HTTP' | 'AUTH' | 'SYSTEM' | 'PRIVACY';

export interface CreateSystemLogInput {
  level: SystemLogLevel;
  category: SystemLogCategory;
  message: string;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  userId?: string | null;
  actorEmail?: string | null;
  ip?: string | null;
  durationMs?: number | null;
  metadata?: Prisma.InputJsonValue | null;
}

@Injectable()
export class SystemLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  private truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
  }

  /**
   * Persiste un registro; nunca lanza (fallos solo a consola).
   */
  async append(input: CreateSystemLogInput): Promise<void> {
    try {
      const log = await this.prisma.systemLog.create({
        data: {
          level: input.level,
          category: input.category,
          message: this.truncate(input.message, MAX_MESSAGE),
          method: input.method ?? null,
          path: input.path != null ? this.truncate(String(input.path), MAX_PATH) : null,
          statusCode: input.statusCode ?? null,
          userId: input.userId ?? null,
          actorEmail: input.actorEmail != null ? this.truncate(String(input.actorEmail), 320) : null,
          ip: input.ip != null ? this.truncate(String(input.ip), 64) : null,
          durationMs: input.durationMs ?? null,
          ...(input.metadata !== undefined && input.metadata !== null
            ? { metadata: input.metadata as Prisma.InputJsonValue }
            : {}),
        },
      });

      // Emitir via WebSockets para monitoreo en vivo (Solo para administradores suscritos a este evento)
      this.gateway.sendBroadcast('liveLog', log);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[SystemLogsService] append failed:', msg);
    }
  }

  async findPage(params: {
    page: number;
    limit: number;
    level?: string;
    category?: string;
  }) {
    const { page, limit, level, category } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.SystemLogWhereInput = {};
    if (level) where.level = level;
    if (category) where.category = category;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, email: true, fullName: true, role: true } },
        },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }
}
