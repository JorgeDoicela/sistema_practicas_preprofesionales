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

  /** Verifica si (lat,lng) está dentro del rango de al menos una ubicación permitida.
   *  Usa `allowedLocations` JSON si existe; sino cae al campo lat/lng legacy.
   *  Devuelve null si está permitido, o un mensaje de error si está fuera de rango. */
  private checkLocationAllowed(
    lat: number,
    lng: number,
    internship: { lat: number | null; lng: number | null; allowedLocations: unknown },
  ): string | null {
    type Loc = { label?: string; lat: number; lng: number; radiusM?: number };
    const locs: Loc[] = Array.isArray(internship.allowedLocations) && internship.allowedLocations.length > 0
      ? (internship.allowedLocations as Loc[])
      : internship.lat && internship.lng
        ? [{ label: 'Lugar de prácticas', lat: internship.lat, lng: internship.lng }]
        : [];

    if (locs.length === 0) {
      return 'La ubicación del lugar de prácticas no ha sido configurada. Contacta a tu tutor académico.';
    }

    for (const loc of locs) {
      const radiusKm = (loc.radiusM ?? 200) / 1000;
      const dist = this.calculateDistance(lat, lng, loc.lat, loc.lng);
      if (dist <= radiusKm) return null; // dentro del rango → permitido
    }

    // Calcular la distancia más cercana para el mensaje de error
    const nearest = locs.reduce((best, loc) => {
      const d = this.calculateDistance(lat, lng, loc.lat, loc.lng);
      return d < best.dist ? { dist: d, label: loc.label ?? 'Sede' } : best;
    }, { dist: Infinity, label: '' });

    return `Estás fuera del rango permitido (${(nearest.dist * 1000).toFixed(0)}m de "${nearest.label}"). Debes estar dentro del radio configurado.`;
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

    // Validar ubicación contra todas las sedes permitidas
    const locationError = this.checkLocationAllowed(lat, lng, internship);
    if (locationError && !internship.testEnabled) {
      throw new BadRequestException(locationError);
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

    // Calcular distancia al punto más cercano para el registro histórico
    type Loc = { lat: number; lng: number; radiusM?: number };
    const locs: Loc[] = Array.isArray(internship.allowedLocations) && (internship.allowedLocations as Loc[]).length > 0
      ? (internship.allowedLocations as Loc[])
      : internship.lat && internship.lng ? [{ lat: internship.lat, lng: internship.lng }] : [];
    const nearestDist = locs.length > 0
      ? Math.min(...locs.map((l) => this.calculateDistance(lat, lng, l.lat, l.lng)))
      : 0;

    return this.prisma.attendance.create({
      data: {
        internshipId: internship.id,
        checkIn: new Date(),
        lat,
        lng,
        distanceKm: nearestDist,
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

    // Validar ubicación contra todas las sedes permitidas
    const locationError = this.checkLocationAllowed(lat, lng, internship);
    if (locationError && !internship.testEnabled) {
      throw new BadRequestException(locationError);
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
