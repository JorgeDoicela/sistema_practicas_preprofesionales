import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, currentUserId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: dto.role,
        companyId: dto.companyId ?? null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    if (id === currentUserId && dto.isActive === false) {
      throw new ForbiddenException('El administrador no puede inhabilitarse a sí mismo');
    }

    if (dto.role || dto.isActive !== undefined) {
      const newRole = dto.role ?? user.role;
      const newIsActive = dto.isActive ?? user.isActive;

      if (user.role === Role.ADMIN || newRole === Role.ADMIN) {
        await this.ensureAtLeastOneActiveAdmin(id, newRole, newIsActive);
      }

      if (user.role === Role.COORDINADOR || newRole === Role.COORDINADOR) {
        await this.ensureSingleActiveCoordinator(id, newRole, newIsActive);
      }
    }

    const data: any = {
      email: dto.email ?? user.email,
      fullName: dto.fullName ?? user.fullName,
      role: dto.role ?? user.role,
      isActive: dto.isActive ?? user.isActive,
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException('El administrador no puede eliminarse a sí mismo');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.ensureNoActiveAssignments(id);

    if (user.role === Role.ADMIN) {
      const activeAdmins = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true, id: { not: id } },
      });
      if (activeAdmins === 0) {
        throw new ForbiddenException(
          'Debe existir al menos un usuario con rol Administrador activo',
        );
      }
    }

    if (user.role === Role.COORDINADOR && user.isActive) {
      throw new ForbiddenException(
        'No se puede eliminar al Coordinador de Prácticas activo. Reasigne el rol primero.',
      );
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'Usuario eliminado correctamente' };
  }

  private async ensureAtLeastOneActiveAdmin(
    userId: string,
    newRole: Role,
    newIsActive: boolean,
  ) {
    if (newRole === Role.ADMIN && newIsActive) {
      return;
    }

    const otherActiveAdmins = await this.prisma.user.count({
      where: {
        id: { not: userId },
        role: Role.ADMIN,
        isActive: true,
      },
    });

    if (otherActiveAdmins === 0) {
      throw new ForbiddenException(
        'Debe existir al menos un usuario con rol Administrador activo',
      );
    }
  }

  private async ensureSingleActiveCoordinator(
    userId: string,
    newRole: Role,
    newIsActive: boolean,
  ) {
    if (newRole !== Role.COORDINADOR || !newIsActive) {
      return;
    }

    const existingCoordinator = await this.prisma.user.findFirst({
      where: {
        id: { not: userId },
        role: Role.COORDINADOR,
        isActive: true,
      },
    });

    if (existingCoordinator) {
      throw new ConflictException(
        'Solo puede existir un usuario con rol de Coordinador de Prácticas activo a la vez',
      );
    }
  }

  private async ensureNoActiveAssignments(userId: string) {
    const activeAssignments = await this.prisma.internship.count({
      where: {
        OR: [{ studentId: userId }, { tutorId: userId }],
        status: { not: 'Finalizado' },
      },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'El usuario tiene asignaciones activas. Reasigne las prácticas antes de eliminarlo.',
      );
    }
  }
}

