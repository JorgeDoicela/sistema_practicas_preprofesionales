import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { PrivacyConsentDto, ArcoRequestDto } from './dto/privacy-actions.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Post('consent')
  recordConsent(@Req() req: any, @Body() dto: PrivacyConsentDto) {
    return this.privacyService.recordConsent(req.user.userId, dto);
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
}
