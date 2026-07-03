import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private systemLogs: SystemLogsService
  ) {}

  async create(dto: CreateAnnouncementDto, userId?: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...dto,
        userId,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    if (userId) {
      this.systemLogs.append({
        level: 'INFO',
        category: 'SYSTEM',
        message: `Nuevo anuncio creado: ${announcement.title} por ${userId}`,
        userId: userId,
        metadata: { announcementId: announcement.id, type: announcement.type }
      });
    }

    return announcement;
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const updateData: any = { ...dto };
    if ('endDate' in dto) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    return this.prisma.announcement.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException('Anuncio no encontrado');

    await this.prisma.announcement.delete({ where: { id } });

    if (announcement.userId) {
      this.systemLogs.append({
        level: 'WARN',
        category: 'SYSTEM',
        message: `Anuncio eliminado: ${announcement.title}`,
        metadata: { announcementId: id, deletedBy: announcement.userId }
      });
    }

    return { message: 'Anuncio eliminado correctamente' };
  }
}
