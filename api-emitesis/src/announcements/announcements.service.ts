import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto, userId?: string) {
    return this.prisma.announcement.create({
      data: {
        ...dto,
        userId,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
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

  async update(id: string, dto: any) {
    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...dto,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
