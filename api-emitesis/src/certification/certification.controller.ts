import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CertificationService } from './certification.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/strategies/roles.guard';
import { Roles } from '../auth/strategies/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('certification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('certification')
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Get('check/:internshipId')
  @Roles('COORDINADOR', 'ADMIN')
  @ApiOperation({ summary: 'Verificar elegibilidad para certificado' })
  async checkEligibility(@Param('internshipId') internshipId: string) {
    return this.certificationService.checkEligibility(internshipId);
  }

  @Post('generate/:internshipId')
  @Roles('COORDINADOR', 'ADMIN')
  @ApiOperation({ summary: 'Generar certificate de culminación' })
  async generateCertificate(@Param('internshipId') internshipId: string) {
    return this.certificationService.generateCertificate(internshipId);
  }
}
