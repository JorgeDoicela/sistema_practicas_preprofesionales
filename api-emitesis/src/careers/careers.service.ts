import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCareerDto, UpdateCareerDto } from './dto/career.dto';

@Injectable()
export class CareersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.career.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, internships: true } },
      },
    });
  }

  async findOne(id: string) {
    const career = await this.prisma.career.findUnique({
      where: { id },
      include: {
        documentTemplates: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { users: true, internships: true } },
      },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    return career;
  }

  async create(dto: CreateCareerDto) {
    const normalizedModalidad = (dto.modalidad as any) ?? 'PRESENCIAL';
    const existing = await this.prisma.career.findUnique({
      where: {
        name_modalidad: {
          name: dto.name,
          modalidad: normalizedModalidad,
        },
      },
    });
    if (existing) throw new ConflictException('Ya existe una carrera con ese nombre');

    return this.prisma.career.create({
      data: {
        name: dto.name,
        faculty: dto.faculty,
        modalidad: normalizedModalidad,
        config: { requiredHours: dto.requiredHours ?? 160 },
      },
    });
  }

  async update(id: string, dto: UpdateCareerDto) {
    await this.findOne(id);

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.faculty !== undefined) updateData.faculty = dto.faculty;
    if (dto.modalidad !== undefined) updateData.modalidad = dto.modalidad;
    if (dto.requiredHours !== undefined) {
      updateData.config = { requiredHours: dto.requiredHours };
    }

    return this.prisma.career.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    const career = await this.prisma.career.findUnique({
      where: { id },
      include: { _count: { select: { internships: true } } },
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    if (career._count.internships > 0) {
      throw new ConflictException(
        `No se puede eliminar: hay ${career._count.internships} prácticas asociadas a esta carrera.`,
      );
    }
    return this.prisma.career.delete({ where: { id } });
  }
}
