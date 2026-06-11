import { Controller, Post, Get, Body, UseGuards, Req, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttendanceService } from './attendance.service';
import { RegisterAttendanceDto } from './dto/register-attendance.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { Role } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @Roles(Role.ESTUDIANTE)
  checkIn(@Req() req: any, @Body() dto: RegisterAttendanceDto) {
    return this.attendanceService.checkIn(req.user.id, dto);
  }

  @Post('check-out')
  @Roles(Role.ESTUDIANTE)
  checkOut(@Req() req: any, @Body() dto: RegisterAttendanceDto) {
    return this.attendanceService.checkOut(req.user.id, dto);
  }

  @Get('today-status')
  @Roles(Role.ESTUDIANTE)
  getTodayStatus(@Req() req: any) {
    return this.attendanceService.getTodayStatus(req.user.id);
  }

  @Get('internship/:id')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ESTUDIANTE, Role.EMPRESA)
  findByInternship(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const { startDate, endDate } = req.query;
    return this.attendanceService.findByInternship(id, startDate, endDate, req.user);
  }

  @Get('internship/:id/summary')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ESTUDIANTE, Role.EMPRESA)
  getSummary(@Param('id') id: string, @Req() req: any) {
    return this.attendanceService.getSummary(id, req.user);
  }

  /** RF-15: Subir foto de entrada o salida antes del check-in/out */
  @Post('upload-photo')
  @Roles(Role.ESTUDIANTE)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new BadRequestException('Solo se permiten imágenes (JPG, PNG, WebP)'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadPhoto(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('El archivo de foto es obligatorio');
    return this.attendanceService.uploadAttendancePhoto(file, req.user.id);
  }

  /** RF-17: Subir foto de actividad del día */
  @Post('activity-photo')
  @Roles(Role.ESTUDIANTE)
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new BadRequestException('Solo se permiten imágenes'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadActivityPhoto(
    @UploadedFile() file: any,
    @Req() req: any,
    @Body('attendanceId') attendanceId: string,
    @Body('caption') caption?: string,
  ) {
    if (!file) throw new BadRequestException('La foto es obligatoria');
    if (!attendanceId) throw new BadRequestException('El ID del registro de asistencia es obligatorio');
    return this.attendanceService.uploadActivityPhoto(attendanceId, file, caption);
  }

  /** RF-17: Obtener fotos de actividades de un registro */
  @Get('activity-photos/:attendanceId')
  @Roles(Role.ESTUDIANTE, Role.TUTOR, Role.COORDINADOR)
  getActivityPhotos(@Param('attendanceId') attendanceId: string) {
    return this.attendanceService.getActivityPhotos(attendanceId);
  }
}
