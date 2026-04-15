import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../infrastructure/storage/storage.service';
import { RegisterAttendanceDto } from './dto/register-attendance.dto';
import { MulterFile } from '../shared/interfaces/multer-file.interface';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
  }

  async checkIn(studentId: string, dto: RegisterAttendanceDto) {
    const { lat, lng } = dto;

    const internship = await this.prisma.internship.findFirst({
      where: { 
        studentId, 
        status: { in: ['Activo', 'En Proceso'] } 
      }
    });

    if (!internship) {
      throw new BadRequestException('No tienes una asignación de prácticas activa');
    }

    // Regla de Negocio: Validar ubicación (Radio 200m = 0.2km)
    if (!internship.lat || !internship.lng) {
        throw new BadRequestException('La ubicación del lugar de prácticas no ha sido configurada');
    }

    const distance = this.calculateDistance(lat, lng, internship.lat, internship.lng);
    if (distance > 0.2) {
      throw new BadRequestException(`Te encuentras fuera del rango permitido (${(distance * 1000).toFixed(0)}m). Debes estar a menos de 200m.`);
    }

    // Regla de Negocio: Solo una entrada por día
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        internshipId: internship.id,
        checkIn: {
          gte: today,
        },
      },
    });

    if (existingAttendance) {
      throw new BadRequestException('Ya has registrado tu entrada el día de hoy');
    }

    return this.prisma.attendance.create({
      data: {
        internshipId: internship.id,
        checkIn: new Date(),
        lat,
        lng,
        distanceKm: distance,
        checkInPhoto: dto.checkInPhotoUrl,
      },
    });
  }

  async checkOut(studentId: string, dto: RegisterAttendanceDto) {
    const { lat, lng } = dto;

    const internship = await this.prisma.internship.findFirst({
      where: { 
        studentId, 
        status: { in: ['Activo', 'En Proceso'] } 
      }
    });

    if (!internship) {
      throw new BadRequestException('No tienes una asignación de prácticas activa');
    }

    // Regla de Negocio: Validar ubicación
    const distance = this.calculateDistance(lat, lng, internship.lat!, internship.lng!);
    if (distance > 0.2) {
      throw new BadRequestException(`Te encuentras fuera del rango permitido (${(distance * 1000).toFixed(0)}m). Debes estar a menos de 200m.`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        internshipId: internship.id,
        checkIn: {
          gte: today,
        },
      },
    });

    if (!attendance) {
      throw new BadRequestException('No se encontró un registro de entrada para el día de hoy');
    }

    if (attendance.checkOut) {
      throw new BadRequestException('Ya has registrado tu salida el día de hoy');
    }

    return this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        checkOutPhoto: dto.checkOutPhotoUrl,
      },
    });
  }

  /** RF-15: Subir foto de entrada/salida a Vercel Blob */
  async uploadAttendancePhoto(file: MulterFile, studentId: string): Promise<{ url: string }> {
    const fileName = `attendance/photos/${studentId}/${Date.now()}-${file.originalname}`;
    const result = await this.storageService.upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });
    return { url: result.url };
  }

  /** RF-17: Subir foto de actividad diaria */
  async uploadActivityPhoto(
    attendanceId: string,
    file: MulterFile,
    caption?: string,
  ) {
    const attendance = await this.prisma.attendance.findUnique({ where: { id: attendanceId } });
    if (!attendance) throw new NotFoundException('Registro de asistencia no encontrado');

    const fileName = `attendance/activities/${attendanceId}/${Date.now()}-${file.originalname}`;
    const result = await this.storageService.upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

    return this.prisma.activityPhoto.create({
      data: {
        attendanceId,
        photoUrl: result.url,
        caption,
      },
    });
  }

  /** RF-17: Listar fotos de actividades de un registro de asistencia */
  async getActivityPhotos(attendanceId: string) {
    return this.prisma.activityPhoto.findMany({
      where: { attendanceId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTodayStatus(studentId: string) {
    const internship = await this.prisma.internship.findFirst({
      where: { 
        studentId, 
        status: { in: ['Activo', 'En Proceso'] } 
      }
    });

    if (!internship) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findFirst({
      where: {
        internshipId: internship.id,
        checkIn: {
          gte: today,
        },
      },
    });
  }

  async findByInternship(internshipId: string, startDate?: string, endDate?: string) {
    const where: any = { internshipId };

    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) where.checkIn.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.checkIn.lte = end;
      }
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { checkIn: 'desc' },
    });
  }

  async getSummary(internshipId: string) {
    const internship = await this.prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        attendances: true,
      },
    });

    if (!internship) throw new NotFoundException('Asignación no encontrada');

    let totalMinutes = 0;
    internship.attendances.forEach((att) => {
      if (att.checkIn && att.checkOut) {
        const diff = att.checkOut.getTime() - att.checkIn.getTime();
        totalMinutes += Math.floor(diff / (1000 * 60));
      }
    });

    const totalHours = Number((totalMinutes / 60).toFixed(2));
    const requiredHours = internship.totalHours || 0;
    const progressPercentage = requiredHours > 0 
      ? Math.min(100, Number(((totalHours / requiredHours) * 100).toFixed(1)))
      : 0;

    return {
      totalHours,
      requiredHours,
      progressPercentage,
      remainingHours: Math.max(0, requiredHours - totalHours),
      totalRecords: internship.attendances.length,
    };
  }
}
