import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { SystemLogsService } from '../system-logs/system-logs.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemLogs: SystemLogsService,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        role: dto.role,
        companyId: dto.companyId ?? null,
        careerId: dto.careerId ?? null,
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

    this.systemLogs.append({
      level: 'INFO',
      category: 'PRIVACY',
      message: `Nuevo usuario creado: ${user.email} con rol ${user.role}`,
      userId: user.id,
      metadata: { action: 'CREATE_USER', role: user.role }
    });

    return user;
  }

  async findAll(page = 1, limit = 10, role?: Role, search?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (search) {
      const searchClean = search.trim();
      if (searchClean) {
        where.OR = [
          { fullName: { contains: searchClean, mode: 'insensitive' } },
          { email: { contains: searchClean, mode: 'insensitive' } },
        ];
      }
    }

    const [data, total, roleCounts, activeCount, inactiveCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          isTwoFactorEnabled: true,
          lopdpAccepted: true,
          lopdpAcceptedAt: true,
          lopdpVersion: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
    ]);

    const rolesSummary = {
      ADMIN: 0,
      COORDINADOR: 0,
      TUTOR: 0,
      ESTUDIANTE: 0,
      EMPRESA: 0,
    };
    roleCounts.forEach((item) => {
      if (item.role in rolesSummary) {
        rolesSummary[item.role] = item._count;
      }
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        roleCounts: rolesSummary,
        statusCounts: {
          active: activeCount,
          inactive: inactiveCount,
        },
      },
    };
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
        careerId: true,
        career: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /** Perfil del usuario autenticado (sin datos sensibles). */
  async findProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        companyId: true,
        isTwoFactorEnabled: true,
        careerId: true,
        career: { select: { id: true, name: true, faculty: true } },
        company: {
          select: {
            id: true,
            name: true,
            ruc: true,
            address: true,
            email: true,
            representative: true,
          },
        },
      },
    });

    if (!user) {
      // Token válido pero usuario inexistente (p. ej. después de reseed): forzar re-login.
      throw new UnauthorizedException('Tu sesión ya no es válida. Inicia sesión nuevamente.');
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
      careerId: dto.careerId !== undefined ? dto.careerId : user.careerId,
    };

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
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

    if (dto.role || dto.isActive !== undefined) {
      this.systemLogs.append({
        level: 'WARN',
        category: 'PRIVACY',
        message: `Usuario ${updatedUser.email} actualizado por ${currentUserId}`,
        userId: currentUserId,
        metadata: { 
          targetUserId: id, 
          oldRole: user.role, 
          newRole: updatedUser.role,
          oldStatus: user.isActive,
          newStatus: updatedUser.isActive
        }
      });
    }

    return updatedUser;
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

    // Verificar si tiene historial antes de intentar borrar (Evita error 500 P2003)
    const hasHistory = await this.prisma.internship.findFirst({
      where: { OR: [{ studentId: id }, { tutorId: id }] },
    });

    if (hasHistory) {
      throw new BadRequestException(
        'No se puede eliminar el usuario porque tiene registros históricos de prácticas. Considere desactivar la cuenta en su lugar.',
      );
    }

    await this.prisma.user.delete({ where: { id } });

    this.systemLogs.append({
      level: 'WARN',
      category: 'PRIVACY',
      message: `Usuario eliminado: ${user.email} por administrador/coordinador ${currentUserId}`,
      userId: currentUserId,
      metadata: { deletedUserId: id, deletedUserEmail: user.email }
    });

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

