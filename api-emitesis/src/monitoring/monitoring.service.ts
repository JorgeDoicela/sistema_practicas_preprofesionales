import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/visit.dto';

@Injectable()
export class MonitoringService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVisitDto) {
    const { internshipId, date, ...data } = dto;

    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException('Internship no encontrado');
    }

    return this.prisma.monitoringVisit.create({
      data: {
        internshipId,
        date: new Date(date),
        ...data,
      },
    });
  }

  async findByInternship(internshipId: string) {
    return this.prisma.monitoringVisit.findMany({
      where: { internshipId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string) {
    return this.prisma.monitoringVisit.delete({
      where: { id },
    });
  }
}
