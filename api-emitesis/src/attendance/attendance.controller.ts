import { Controller, Post, Get, Body, UseGuards, Req, Param } from '@nestjs/common';
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
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ADMIN, Role.ESTUDIANTE)
  findByInternship(
    @Param('id') id: string,
    @Req() req: any
  ) {
    const { startDate, endDate } = req.query;
    return this.attendanceService.findByInternship(id, startDate, endDate);
  }

  @Get('internship/:id/summary')
  @Roles(Role.TUTOR, Role.COORDINADOR, Role.ADMIN, Role.ESTUDIANTE)
  getSummary(@Param('id') id: string) {
    return this.attendanceService.getSummary(id);
  }
}
