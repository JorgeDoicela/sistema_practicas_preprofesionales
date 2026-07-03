import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/strategies/roles.decorator';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { PrivacyService } from './privacy.service';
import { PrivacyConsentDto, ArcoRequestDto, RespondToArcoRequestDto } from './dto/privacy-actions.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('consent')
  recordConsent(@Req() req: any, @Body() dto: PrivacyConsentDto) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.privacyService.recordConsent(req.user.userId, dto, String(ip), userAgent);
  }

  @Post('arco-request')
  createArcoRequest(@Req() req: any, @Body() dto: ArcoRequestDto) {
    return this.privacyService.createArcoRequest(req.user.userId, dto);
  }

  @Get('my-data')
  getUserData(@Req() req: any) {
    return this.privacyService.getUserDataSummary(req.user.userId);
  }

  @Get('my-requests')
  getMyRequests(@Req() req: any) {
    return this.privacyService.getMyRequests(req.user.userId);
  }

  // ── Rutas de Administración (LOPDP) ────────────────────────────────────────

  @Get('admin/requests')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findAllAdmin() {
    return this.privacyService.findAllRequests();
  }

  @Get('admin/logs')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COORDINADOR)
  findAllLogs() {
    return this.privacyService.findAllLogs();
  }

  @Patch('admin/requests/:id/respond')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.COORDINADOR)
  respondAdmin(
    @Param('id') id: string,
    @Body() dto: RespondToArcoRequestDto
  ) {
    return this.privacyService.respondToRequest(id, dto.response, dto.status);
  }
}
